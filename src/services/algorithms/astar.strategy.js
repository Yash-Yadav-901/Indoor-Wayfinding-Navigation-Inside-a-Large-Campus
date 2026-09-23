import { PriorityQueue } from '../../utils/priority_queue.js'

export class AStarStrategy {
  calculateHeuristic(nodeA, nodeB) {
    if (!nodeA || !nodeB) return 0
    let h = 0
    if (nodeA.building !== nodeB.building) h += 20
    if (nodeA.floor !== nodeB.floor) h += Math.abs(nodeA.floor - nodeB.floor) * 15
    return h
  }

  findPath(graph, startId, endId, options = {}) {
    const { wheelchair = false, currentTime = null } = options
    const targetNode = graph.nodes.get(endId)
    const gScore = new Map()
    const fScore = new Map()
    const prev = new Map()
    const openSet = new PriorityQueue()

    for (const id of graph.nodes.keys()) {
      gScore.set(id, Infinity)
      fScore.set(id, Infinity)
      prev.set(id, null)
    }

    gScore.set(startId, 0)
    const startNode = graph.nodes.get(startId)
    const initialH = this.calculateHeuristic(startNode, targetNode)
    fScore.set(startId, initialH)
    openSet.enqueue(startId, initialH)

    while (!openSet.isEmpty()) {
      const { node: current } = openSet.dequeue()
      if (current === endId) break

      const neighbors = graph.adjacencyList.get(current) || []
      for (const edge of neighbors) {
        if (wheelchair && !edge.isAccessible) continue
        if (!graph.isEdgeOpen(edge.openHours, currentTime)) continue

        const cost = edge.distance * (edge.congestionWeight || 1)
        const tentativeG = gScore.get(current) + cost

        if (tentativeG < gScore.get(edge.node)) {
          prev.set(edge.node, current)
          gScore.set(edge.node, tentativeG)
          const h = this.calculateHeuristic(graph.nodes.get(edge.node), targetNode)
          const f = tentativeG + h
          fScore.set(edge.node, f)
          openSet.enqueue(edge.node, f)
        }
      }
    }

    const totalDist = gScore.get(endId)
    if (totalDist === Infinity) return null

    const path = []
    let curr = endId
    while (curr !== null) {
      path.unshift(curr)
      curr = prev.get(curr)
    }

    return {
      distance: Math.round(totalDist * 100) / 100,
      path,
      algorithm: 'astar',
    }
  }
}
