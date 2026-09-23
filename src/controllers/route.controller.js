import { findShortestPath } from '../services/graph.service.js'
import { cacheGet, cacheSet } from '../services/cache.service.js'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { config } from '../config/index.js'

export const getRoute = asyncHandler(async (req, res) => {
  const { start, end, wheelchair } = req.query

  if (!start || !end) {
    throw new ApiError(400, 'start and end node IDs are required query params')
  }

  const startId = parseInt(start)
  const endId = parseInt(end)

  if (isNaN(startId) || isNaN(endId)) {
    throw new ApiError(400, 'start and end must be valid integer node IDs')
  }

  if (startId === endId) {
    throw new ApiError(400, 'start and end nodes must be different')
  }

  const isWheelchair = wheelchair === 'true'
  const cacheKey = `route:${startId}:${endId}:${isWheelchair}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    return res.status(200).json(new ApiResponse(200, { ...cached, fromCache: true }, 'Route retrieved from cache'))
  }

  const result = await findShortestPath(startId, endId, isWheelchair)

  if (!result || result.distance === Infinity) {
    throw new ApiError(404, 'No path found between the given nodes — route may be blocked or inaccessible')
  }

  await cacheSet(cacheKey, result, config.cache.routeTTL)

  res.status(200).json(new ApiResponse(200, { ...result, fromCache: false }, 'Route calculated successfully'))
})
