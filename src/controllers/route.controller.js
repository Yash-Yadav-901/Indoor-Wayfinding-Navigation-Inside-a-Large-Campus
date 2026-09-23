
import { findShortestPath } from '../services/graph.service.js'

export async function getRoute(req, res) {
  const { start, end, wheelchair } = req.query
  const result = await findShortestPath(
    parseInt(start),
    parseInt(end),
    wheelchair === 'true'
  )
  res.json(result)
}
