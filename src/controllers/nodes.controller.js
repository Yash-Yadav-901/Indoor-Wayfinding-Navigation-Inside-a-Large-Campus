import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'

const prisma = new PrismaClient()

export const listNodes = asyncHandler(async (req, res) => {
  const nodes = await prisma.node.findMany({
    include: { pois: true, edgesFrom: true, edgesTo: true }
  })
  res.status(200).json(new ApiResponse(200, nodes, 'Nodes fetched successfully'))
})

export const getNode = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid node ID')

  const node = await prisma.node.findUnique({
    where: { id },
    include: { pois: true, edgesFrom: true, edgesTo: true }
  })
  if (!node) throw new ApiError(404, `Node with id ${id} not found`)

  res.status(200).json(new ApiResponse(200, node, 'Node fetched successfully'))
})

export const addNode = asyncHandler(async (req, res) => {
  const { name, floor, building, type } = req.body
  if (!name || floor === undefined || !building || !type) {
    throw new ApiError(400, 'name, floor, building and type are required', [
      !name && 'name is required',
      floor === undefined && 'floor is required',
      !building && 'building is required',
      !type && 'type is required',
    ].filter(Boolean))
  }

  const node = await prisma.node.create({ data: { name, floor, building, type } })
  res.status(201).json(new ApiResponse(201, node, 'Node created successfully'))
})

export const editNode = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid node ID')

  const node = await prisma.node.update({
    where: { id },
    data: req.body
  })
  res.status(200).json(new ApiResponse(200, node, 'Node updated successfully'))
})

export const removeNode = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) throw new ApiError(400, 'Invalid node ID')

  await prisma.node.delete({ where: { id } })
  res.status(200).json(new ApiResponse(200, null, 'Node deleted successfully'))
})
