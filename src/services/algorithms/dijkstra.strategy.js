import { PriorityQueue } from '../../utils/priority_queue.js'

export class DijkstraStrategy {
  findPath(graph, startId, endId, options = {}) {
    const { wheelchair = false, currentTime = null } = options
    const distances = new Map()
    const prev = new Map()
    const pq = new PriorityQueue()

    for (const id of graph.nodes.keys()) {
      distances.set(id, Infinity)
      prev.set(id, null)
    }

    distances.set(startId, 0)
    pq.enqueue(startId, 0)

    while (!pq.isEmpty()) {
      const { node: u, dist: d } = pq.dequeue()
      if (u === endId) break
      if (d > distances.get(u)) continue

      const neighbors = graph.adjacencyList.get(u) || []
      for (const edge of neighbors) {
        if (wheelchair && !edge.isAccessible) continue
        if (!graph.isEdgeOpen(edge.openHours, currentTime)) continue

        const cost = edge.distance * (edge.congestionWeight || 1)
        const alt = d + cost

        if (alt < distances.get(edge.node)) {
          distances.set(edge.node, alt)
          prev.set(edge.node, u)
          pq.enqueue(edge.node, alt)
        }
      }
    }

    const totalDist = distances.get(endId)
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
      algorithm: 'dijkstra',
    }
  }
}
