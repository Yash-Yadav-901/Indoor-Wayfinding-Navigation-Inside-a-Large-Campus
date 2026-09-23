import { PrismaClient } from '@prisma/client'
import { cacheGet, cacheSet } from './cache.service.js'
import { config } from '../config/index.js'
import { DijkstraStrategy } from './algorithms/dijkstra.strategy.js'
import { AStarStrategy } from './algorithms/astar.strategy.js'
import { FloydWarshallStrategy } from './algorithms/floyd_warshall.strategy.js'

const prisma = new PrismaClient()
const GRAPH_CACHE_KEY = 'graph:campus:all'

const strategies = {
  dijkstra: new DijkstraStrategy(),
  astar: new AStarStrategy(),
  hierarchical: new FloydWarshallStrategy(),
  'floyd-warshall': new FloydWarshallStrategy(),
}

export class CampusGraph {
  constructor() {
    this.adjacencyList = new Map()
    this.nodes = new Map()
  }

  isEdgeOpen(openHoursStr, queryTimeStr) {
    if (!openHoursStr) return true
    if (openHoursStr === '00:00-00:00' || openHoursStr === 'closed') return false

    if (!queryTimeStr) return true

    const parseMinutes = (str) => {
      const [h, m] = str.split(':').map((v) => parseInt(v, 10))
      return isNaN(h) || isNaN(m) ? null : h * 60 + m
    }

    const q = parseMinutes(queryTimeStr)
    if (q === null) return true

    const [startStr, endStr] = openHoursStr.split('-')
    const start = parseMinutes(startStr)
    const end = parseMinutes(endStr)
    if (start === null || end === null) return true
    if (start === end) return false

    if (start <= end) {
      return q >= start && q <= end
    }
    return q >= start || q <= end
  }

  async load() {
    const cached = await cacheGet(GRAPH_CACHE_KEY)
    if (cached?.nodes && cached?.edges) {
      this.populate(cached.nodes, cached.edges)
      return
    }

    const [nodes, edges] = await Promise.all([
      prisma.node.findMany({ include: { pois: true } }),
      prisma.edge.findMany(),
    ])

    await cacheSet(GRAPH_CACHE_KEY, { nodes, edges }, config.cache.graphTTL)
    this.populate(nodes, edges)
  }

  populate(nodes, edges) {
    this.adjacencyList.clear()
    this.nodes.clear()

    for (const node of nodes) {
      this.nodes.set(node.id, node)
      this.adjacencyList.set(node.id, [])
    }

    for (const edge of edges) {
      if (!this.adjacencyList.has(edge.start_node)) {
        this.adjacencyList.set(edge.start_node, [])
      }
      if (!this.adjacencyList.has(edge.end_node)) {
        this.adjacencyList.set(edge.end_node, [])
      }

      this.adjacencyList.get(edge.start_node).push({
        node: edge.end_node,
        distance: edge.distance,
        congestionWeight: edge.congestion_weight || 1.0,
        isAccessible: edge.is_accessible,
        accessibilityReason: edge.accessibility_reason,
        openHours: edge.open_hours,
      })

      this.adjacencyList.get(edge.end_node).push({
        node: edge.start_node,
        distance: edge.distance,
        congestionWeight: edge.congestion_weight || 1.0,
        isAccessible: edge.is_accessible,
        accessibilityReason: edge.accessibility_reason,
        openHours: edge.open_hours,
      })
    }
  }

  generateInstructions(nodePath) {
    if (!nodePath || nodePath.length < 2) {
      return ['You are already at your destination.']
    }

    const instructions = []
    const startNode = this.nodes.get(nodePath[0])
    const endNode = this.nodes.get(nodePath[nodePath.length - 1])

    instructions.push(`Start at ${startNode.name} (Building ${startNode.building}, Floor ${startNode.floor})`)

    for (let i = 0; i < nodePath.length - 1; i++) {
      const current = this.nodes.get(nodePath[i])
      const next = this.nodes.get(nodePath[i + 1])
      if (!current || !next) continue

      if (current.floor !== next.floor) {
        const method = current.type === 'lift' || next.type === 'lift' ? 'Lift' : 'Stairs'
        instructions.push(`Take ${method} from Floor ${current.floor} to Floor ${next.floor} (${next.name})`)
      } else if (current.building !== next.building) {
        instructions.push(`Cross walkway from Building ${current.building} to Building ${next.building} (${next.name})`)
      } else {
        instructions.push(`Walk along ${current.name} towards ${next.name}`)
      }
    }

    instructions.push(`Arrive at ${endNode.name} (Building ${endNode.building}, Floor ${endNode.floor})`)
    return instructions
  }

  selectOptimalStrategy(startNode, endNode, options = {}) {
    if (options.algorithm && strategies[options.algorithm.toLowerCase()]) {
      return strategies[options.algorithm.toLowerCase()]
    }

    if (options.wheelchair || options.currentTime) {
      return strategies.dijkstra
    }

    if (startNode.building === endNode.building && startNode.floor === endNode.floor) {
      return strategies.hierarchical
    }

    return strategies.astar
  }

  findPath(startId, endId, options = {}) {
    if (!this.nodes.has(startId)) {
      throw new Error(`Start node ${startId} does not exist`)
    }
    if (!this.nodes.has(endId)) {
      throw new Error(`Destination node ${endId} does not exist`)
    }

    const startNode = this.nodes.get(startId)
    const endNode = this.nodes.get(endId)
    const strategy = this.selectOptimalStrategy(startNode, endNode, options)
    const result = strategy.findPath(this, startId, endId, options)

    if (!result) return null

    return {
      distance: result.distance,
      path: result.path,
      pathDetails: result.path.map((id) => this.nodes.get(id)),
      instructions: this.generateInstructions(result.path),
      algorithmUsed: result.algorithm,
      wheelchair: Boolean(options.wheelchair),
      time: options.currentTime || null,
    }
  }

  findNearestPoi(startId, poiType, options = {}) {
    if (!this.nodes.has(startId)) {
      throw new Error(`Start node ${startId} does not exist`)
    }

    const targetNodes = []
    for (const [id, node] of this.nodes.entries()) {
      if (node.pois && node.pois.some((p) => p.type.toLowerCase() === poiType.toLowerCase())) {
        targetNodes.push(id)
      }
    }

    if (targetNodes.length === 0) return null

    let bestResult = null
    let minDistance = Infinity

    for (const targetId of targetNodes) {
      if (targetId === startId) continue
      const route = this.findPath(startId, targetId, options)
      if (route && route.distance < minDistance) {
        minDistance = route.distance
        bestResult = {
          route,
          targetNode: this.nodes.get(targetId),
          poi: this.nodes.get(targetId).pois.find((p) => p.type.toLowerCase() === poiType.toLowerCase()),
        }
      }
    }

    if (!bestResult) return null

    return {
      poi: bestResult.poi,
      destinationNode: bestResult.targetNode,
      distance: bestResult.route.distance,
      path: bestResult.route.path,
      pathDetails: bestResult.route.pathDetails,
      instructions: bestResult.route.instructions,
    }
  }

  findMultiStopRoute(startId, stopIds, endId, options = {}) {
    if (!stopIds || stopIds.length === 0) {
      return this.findPath(startId, endId, options)
    }

    let current = startId
    let totalDist = 0
    let combinedPath = [startId]
    const remaining = new Set(stopIds)
    const visitedStops = []

    while (remaining.size > 0) {
      let closestStop = null
      let shortestLeg = null
      let minDist = Infinity

      for (const candidate of remaining) {
        const leg = this.findPath(current, candidate, options)
        if (leg && leg.distance < minDist) {
          minDist = leg.distance
          closestStop = candidate
          shortestLeg = leg
        }
      }

      if (!closestStop) {
        throw new Error('Unable to find route to remaining stops')
      }

      remaining.delete(closestStop)
      visitedStops.push(this.nodes.get(closestStop))
      totalDist += minDist
      combinedPath.push(...shortestLeg.path.slice(1))
      current = closestStop
    }

    const finalLeg = this.findPath(current, endId, options)
    if (!finalLeg) {
      throw new Error('Unable to reach final destination from last stop')
    }

    totalDist += finalLeg.distance
    combinedPath.push(...finalLeg.path.slice(1))

    return {
      distance: Math.round(totalDist * 100) / 100,
      stopsVisitedOrder: visitedStops,
      path: combinedPath,
      pathDetails: combinedPath.map((id) => this.nodes.get(id)),
      instructions: this.generateInstructions(combinedPath),
      wheelchair: Boolean(options.wheelchair),
      time: options.currentTime || null,
    }
  }
}

export async function getCampusGraph() {
  const graph = new CampusGraph()
  await graph.load()
  return graph
}

export async function findShortestPath(startId, endId, options = {}) {
  const graph = await getCampusGraph()
  return graph.findPath(startId, endId, options)
}

export async function findNearestPoi(startId, poiType, options = {}) {
  const graph = await getCampusGraph()
  return graph.findNearestPoi(startId, poiType, options)
}

export async function findMultiStopRoute(startId, stopIds, endId, options = {}) {
  const graph = await getCampusGraph()
  return graph.findMultiStopRoute(startId, stopIds, endId, options)
}
