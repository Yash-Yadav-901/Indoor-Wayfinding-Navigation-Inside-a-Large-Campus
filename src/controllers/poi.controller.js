import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'

const prisma = new PrismaClient()

export const listPois = asyncHandler(async (req, res) => {
    const pois = await prisma.poi.findMany({ include: { node: true } })
    res.status(200).json(new ApiResponse(200, pois, 'POIs fetched successfully'))
})

export const getNearestPoi = asyncHandler(async (req, res) => {
    const { node_id, type } = req.query

    if (!node_id || !type) {
        throw new ApiError(400, 'node_id and type are required query params')
    }

    const nodeId = parseInt(node_id)
    if (isNaN(nodeId)) throw new ApiError(400, 'node_id must be a number')

    const pois = await prisma.poi.findMany({
        where: { type },
        include: { node: true }
    })

    if (!pois.length) {
        throw new ApiError(404, `No POI of type "${type}" found in the campus`)
    }

    res.status(200).json(new ApiResponse(200, pois, `Nearest POIs of type "${type}" fetched`))
})

export const addPoi = asyncHandler(async (req, res) => {
    const { node_id, type } = req.body
    if (!node_id || !type) {
        throw new ApiError(400, 'node_id and type are required')
    }

    const poi = await prisma.poi.create({ data: req.body })
    res.status(201).json(new ApiResponse(201, poi, 'POI created successfully'))
})

export const removePoi = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) throw new ApiError(400, 'Invalid POI ID')

    await prisma.poi.delete({ where: { id } })
    res.status(200).json(new ApiResponse(200, null, 'POI deleted successfully'))
})
