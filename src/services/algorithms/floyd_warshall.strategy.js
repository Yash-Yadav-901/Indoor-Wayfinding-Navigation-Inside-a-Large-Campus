export class FloydWarshallStrategy {
  constructor() {
    this.matrices = new Map()
    this.nextHops = new Map()
    this.initialized = false
  }

  getSubgraphKey(node) {
    return `${node.building}_F${node.floor}`
  }

  precomputeSubgraphs(graph) {
    this.matrices.clear()
    this.nextHops.clear()

    const subgraphs = new Map()
    for (const [id, node] of graph.nodes.entries()) {
      const key = this.getSubgraphKey(node)
      if (!subgraphs.has(key)) subgraphs.set(key, [])
      subgraphs.get(key).push(id)
    }

    for (const [key, nodeIds] of subgraphs.entries()) {
      const dist = new Map()
      const next = new Map()

      for (const u of nodeIds) {
        dist.set(u, new Map())
        next.set(u, new Map())
        for (const v of nodeIds) {
          dist.get(u).set(v, u === v ? 0 : Infinity)
          next.get(u).set(v, null)
        }
      }

      for (const u of nodeIds) {
        const neighbors = graph.adjacencyList.get(u) || []
        for (const edge of neighbors) {
          if (nodeIds.includes(edge.node)) {
            const cost = edge.distance * (edge.congestionWeight || 1)
            dist.get(u).set(edge.node, cost)
            next.get(u).set(edge.node, edge.node)
          }
        }
      }

      for (const k of nodeIds) {
        for (const i of nodeIds) {
          for (const j of nodeIds) {
            const dIK = dist.get(i).get(k)
            const dKJ = dist.get(k).get(j)
            const dIJ = dist.get(i).get(j)
            if (dIK + dKJ < dIJ) {
              dist.get(i).set(j, dIK + dKJ)
              next.get(i).set(j, next.get(i).get(k))
            }
          }
        }
      }

      this.matrices.set(key, dist)
      this.nextHops.set(key, next)
    }

    this.initialized = true
  }

  reconstructPath(key, startId, endId) {
    const next = this.nextHops.get(key)
    if (!next || !next.get(startId) || next.get(startId).get(endId) === null) {
      return null
    }

    const path = [startId]
    let curr = startId
    while (curr !== endId) {
      curr = next.get(curr).get(endId)
      if (curr === null) return null
      path.push(curr)
    }
    return path
  }

  findPath(graph, startId, endId, options = {}) {
    if (!this.initialized) {
      this.precomputeSubgraphs(graph)
    }

    const startNode = graph.nodes.get(startId)
    const endNode = graph.nodes.get(endId)
    const startKey = this.getSubgraphKey(startNode)
    const endKey = this.getSubgraphKey(endNode)

    if (startKey === endKey) {
      const dist = this.matrices.get(startKey)?.get(startId)?.get(endId)
      if (dist !== undefined && dist !== Infinity) {
        const path = this.reconstructPath(startKey, startId, endId)
        if (path) {
          return {
            distance: Math.round(dist * 100) / 100,
            path,
            algorithm: 'floyd-warshall-subgraph',
          }
        }
      }
    }

    // Cross-subgraph transition: Gateway routing
    const gateways = []
    for (const [id, node] of graph.nodes.entries()) {
      if (['lift', 'stair', 'junction'].includes(node.type)) {
        gateways.push(id)
      }
    }

    let bestDist = Infinity
    let bestPath = null

    for (const g1 of gateways) {
      if (this.getSubgraphKey(graph.nodes.get(g1)) !== startKey) continue
      const d1 = this.matrices.get(startKey)?.get(startId)?.get(g1)
      if (d1 === undefined || d1 === Infinity) continue

      for (const g2 of gateways) {
        if (this.getSubgraphKey(graph.nodes.get(g2)) !== endKey) continue
        const d2 = this.matrices.get(endKey)?.get(g2)?.get(endId)
        if (d2 === undefined || d2 === Infinity) continue

        const connectingEdge = (graph.adjacencyList.get(g1) || []).find((e) => e.node === g2)
        if (!connectingEdge) continue

        const total = d1 + connectingEdge.distance * (connectingEdge.congestionWeight || 1) + d2
        if (total < bestDist) {
          const path1 = this.reconstructPath(startKey, startId, g1)
          const path2 = this.reconstructPath(endKey, g2, endId)
          if (path1 && path2) {
            bestDist = total
            bestPath = [...path1, ...path2.slice(path1[path1.length - 1] === g2 ? 1 : 0)]
          }
        }
      }
    }

    if (!bestPath) return null

    return {
      distance: Math.round(bestDist * 100) / 100,
      path: bestPath,
      algorithm: 'floyd-warshall-hierarchical',
    }
  }
}
