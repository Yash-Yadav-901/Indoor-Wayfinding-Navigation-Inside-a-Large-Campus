import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'
import { cacheDel, cacheDelPattern } from '../services/cache.service.js'

const prisma = new PrismaClient()

async function invalidateAllCaches() {
  await cacheDel('graph:campus:all')
  await cacheDelPattern('route:*')
  await cacheDelPattern('nearest_poi:*')
}

export const closeEdge = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { reason } = req.body

  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')

  const edge = await prisma.edge.findUnique({ where: { id } })
  if (!edge) throw new ApiError(404, `Edge with id ${id} not found`)

  const updated = await prisma.edge.update({
    where: { id },
    data: {
      open_hours: '00:00-00:00',
      accessibility_reason: reason || 'Temporarily closed for maintenance',
    },
  })

  await invalidateAllCaches()
  res.status(200).json(new ApiResponse(200, updated, `Edge ${id} has been temporarily closed`))
})

export const reopenEdge = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { open_hours } = req.body

  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')

  const edge = await prisma.edge.findUnique({ where: { id } })
  if (!edge) throw new ApiError(404, `Edge with id ${id} not found`)

  const updated = await prisma.edge.update({
    where: { id },
    data: {
      open_hours: open_hours || null,
      accessibility_reason: null,
    },
  })

  await invalidateAllCaches()
  res.status(200).json(new ApiResponse(200, updated, `Edge ${id} has been reopened`))
})

export const setEdgeCongestion = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { congestion_weight } = req.body

  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')
  if (congestion_weight === undefined || isNaN(parseFloat(congestion_weight))) {
    throw new ApiError(400, 'A valid numeric congestion_weight is required')
  }

  const weight = parseFloat(congestion_weight)
  if (weight < 0.1) throw new ApiError(400, 'Congestion weight must be greater than 0.1')

  const updated = await prisma.edge.update({
    where: { id },
    data: { congestion_weight: weight },
  })

  await invalidateAllCaches()
  res.status(200).json(new ApiResponse(200, updated, `Congestion weight for edge ${id} set to ${weight}`))
})

export const setEdgeAccessibility = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { is_accessible, accessibility_reason } = req.body

  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')
  if (is_accessible === undefined) {
    throw new ApiError(400, 'is_accessible boolean is required')
  }

  const updated = await prisma.edge.update({
    where: { id },
    data: {
      is_accessible: Boolean(is_accessible),
      accessibility_reason: is_accessible ? null : (accessibility_reason || 'Inaccessible / Maintenance'),
    },
  })

  await invalidateAllCaches()
  res.status(200).json(new ApiResponse(200, updated, `Edge ${id} accessibility updated`))
})

export const getCampusAnalytics = asyncHandler(async (req, res) => {
  const [totalNodes, totalEdges, totalPois, closedEdges, congestedEdges, inaccessibleEdges] = await Promise.all([
    prisma.node.count(),
    prisma.edge.count(),
    prisma.poi.count(),
    prisma.edge.count({ where: { open_hours: '00:00-00:00' } }),
    prisma.edge.count({ where: { congestion_weight: { gt: 1.0 } } }),
    prisma.edge.count({ where: { is_accessible: false } }),
  ])

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalNodes,
        totalEdges,
        totalPois,
        activeClosures: closedEdges,
        congestedCorridors: congestedEdges,
        inaccessiblePassages: inaccessibleEdges,
      },
      'Campus network statistics fetched'
    )
  )
})
