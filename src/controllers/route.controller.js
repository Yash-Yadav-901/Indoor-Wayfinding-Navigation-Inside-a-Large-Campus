import { findShortestPath, findNearestPoi, findMultiStopRoute } from '../services/graph.service.js'
import { cacheGet, cacheSet } from '../services/cache.service.js'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { config } from '../config/index.js'

export const getRoute = asyncHandler(async (req, res) => {
  const { start, end, wheelchair, time, algorithm } = req.query

  if (!start || !end) {
    throw new ApiError(400, 'start and end node IDs are required query parameters')
  }

  const startId = parseInt(start, 10)
  const endId = parseInt(end, 10)

  if (isNaN(startId) || isNaN(endId)) {
    throw new ApiError(400, 'start and end must be valid integer node IDs')
  }

  if (startId === endId) {
    throw new ApiError(400, 'start and end nodes must be different')
  }

  const isWheelchair = wheelchair === 'true'
  const queryTime = time ? time.trim() : null
  const algo = algorithm ? algorithm.trim().toLowerCase() : 'dijkstra'
  const cacheKey = `route:${startId}:${endId}:${isWheelchair}:${queryTime || 'any'}:${algo}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    return res.status(200).json(new ApiResponse(200, { ...cached, fromCache: true }, 'Route retrieved from cache'))
  }

  const result = await findShortestPath(startId, endId, {
    wheelchair: isWheelchair,
    currentTime: queryTime,
    algorithm: algo,
  })

  if (!result || result.distance === Infinity) {
    throw new ApiError(404, 'No path found between the given nodes')
  }

  await cacheSet(cacheKey, result, config.cache.routeTTL)
  res.status(200).json(new ApiResponse(200, { ...result, fromCache: false }, 'Route calculated successfully'))
})

export const getNearestPoiRoute = asyncHandler(async (req, res) => {
  const { start, type, wheelchair, time } = req.query

  if (!start || !type) {
    throw new ApiError(400, 'start and type query parameters are required')
  }

  const startId = parseInt(start, 10)
  if (isNaN(startId)) {
    throw new ApiError(400, 'start must be a valid integer node ID')
  }

  const isWheelchair = wheelchair === 'true'
  const queryTime = time ? time.trim() : null
  const cacheKey = `nearest_poi:${startId}:${type}:${isWheelchair}:${queryTime || 'any'}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    return res.status(200).json(new ApiResponse(200, { ...cached, fromCache: true }, 'Nearest POI retrieved from cache'))
  }

  const result = await findNearestPoi(startId, type, {
    wheelchair: isWheelchair,
    currentTime: queryTime,
  })

  if (!result) {
    throw new ApiError(404, `No accessible POI of type "${type}" found`)
  }

  await cacheSet(cacheKey, result, config.cache.routeTTL)
  res.status(200).json(new ApiResponse(200, { ...result, fromCache: false }, `Nearest ${type} located successfully`))
})

export const getMultiStopRoute = asyncHandler(async (req, res) => {
  const { start, stops, end, wheelchair, time } = req.body

  if (!start || !end) {
    throw new ApiError(400, 'start and end node IDs are required')
  }

  const startId = parseInt(start, 10)
  const endId = parseInt(end, 10)

  if (isNaN(startId) || isNaN(endId)) {
    throw new ApiError(400, 'start and end must be valid integers')
  }

  const stopIds = Array.isArray(stops)
    ? stops.map((s) => parseInt(s, 10)).filter((id) => !isNaN(id))
    : []

  const isWheelchair = Boolean(wheelchair)
  const queryTime = time ? time.trim() : null

  const result = await findMultiStopRoute(startId, stopIds, endId, {
    wheelchair: isWheelchair,
    currentTime: queryTime,
  })

  res.status(200).json(new ApiResponse(200, result, 'Multi-stop route calculated successfully'))
})
