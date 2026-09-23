import { PrismaClient } from '@prisma/client'
import { cacheGet, cacheSet } from './cache.service.js'
import { config } from '../config/index.js'

const prisma = new PrismaClient()

const GRAPH_CACHE_KEY = 'graph:edges'

class PriorityQueue {
  constructor() {
    this.heap = []
  }
  enqueue(node, dist) {
    this.heap.push({ node, dist })
    this.heap.sort((a, b) => a.dist - b.dist)
  }
  dequeue() {
    return this.heap.shift()
  }
  isEmpty() {
    return this.heap.length === 0
  }
}

async function buildGraph() {
  const cached = await cacheGet(GRAPH_CACHE_KEY)
  if (cached) return cached

  const edges = await prisma.edge.findMany()
  const graph = {}

  edges.forEach(edge => {
    if (!graph[edge.start_node]) graph[edge.start_node] = []
    if (!graph[edge.end_node]) graph[edge.end_node] = []

    graph[edge.start_node].push({
      node: edge.end_node,
      weight: edge.distance * (edge.congestion_weight || 1),
      isAccessible: edge.is_accessible,
    })
    graph[edge.end_node].push({
      node: edge.start_node,
      weight: edge.distance * (edge.congestion_weight || 1),
      isAccessible: edge.is_accessible,
    })
  })

  await cacheSet(GRAPH_CACHE_KEY, graph, config.cache.graphTTL)
  return graph
}

export async function findShortestPath(startId, endId, wheelchair = false) {
  const graph = await buildGraph()
  const distances = {}
  const prev = {}
  const pq = new PriorityQueue()

  Object.keys(graph).forEach(node => {
    distances[node] = Infinity
    prev[node] = null
  })

  distances[startId] = 0
  pq.enqueue(startId, 0)

  while (!pq.isEmpty()) {
    const { node: current } = pq.dequeue()
    if (parseInt(current) === endId) break

    for (const neighbor of (graph[current] || [])) {
      if (wheelchair && !neighbor.isAccessible) continue
      const alt = distances[current] + neighbor.weight
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt
        prev[neighbor.node] = current
        pq.enqueue(neighbor.node, alt)
      }
    }
  }

  const path = []
  let u = endId
  while (u !== null) {
    path.unshift(u)
    u = prev[u]
  }

  return { distance: distances[endId], path }
}
