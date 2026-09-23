import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'

const prisma = new PrismaClient()

export const listEdges = asyncHandler(async (req, res) => {
  const edges = await prisma.edge.findMany({
    include: { startNode: true, endNode: true }
  })
  res.status(200).json(new ApiResponse(200, edges, 'Edges fetched successfully'))
})

export const getEdge = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')

  const edge = await prisma.edge.findUnique({
    where: { id },
    include: { startNode: true, endNode: true }
  })
  if (!edge) throw new ApiError(404, `Edge with id ${id} not found`)

  res.status(200).json(new ApiResponse(200, edge, 'Edge fetched successfully'))
})

export const addEdge = asyncHandler(async (req, res) => {
  const { start_node, end_node, distance, is_accessible } = req.body
  if (!start_node || !end_node || distance === undefined || is_accessible === undefined) {
    throw new ApiError(400, 'start_node, end_node, distance and is_accessible are required')
  }

  const edge = await prisma.edge.create({ data: req.body })
  res.status(201).json(new ApiResponse(201, edge, 'Edge created successfully'))
})

export const editEdge = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')

  const edge = await prisma.edge.update({
    where: { id },
    data: req.body
  })
  res.status(200).json(new ApiResponse(200, edge, 'Edge updated successfully'))
})

export const removeEdge = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid edge ID')

  await prisma.edge.delete({ where: { id } })
  res.status(200).json(new ApiResponse(200, null, 'Edge deleted successfully'))
})
