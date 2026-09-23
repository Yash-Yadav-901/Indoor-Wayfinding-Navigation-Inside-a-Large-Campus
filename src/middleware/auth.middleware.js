import { verifyToken } from '../services/auth.service.js'
import { ApiError } from '../utils/api_error.js'
import { asyncHandler } from '../utils/async_handler.js'

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token missing or malformed')
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    throw new ApiError(401, 'Token not provided')
  }

  const decoded = verifyToken(token)
  req.user = decoded
  next()
})

export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated')
  }
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied: Admins only')
  }
  next()
})
