import { Prisma } from '@prisma/client'
import { ApiError } from '../utils/api_error.js'

export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: `Duplicate value: ${err.meta?.target?.join(', ')} already exists`,
        errors: [],
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        errors: [],
      })
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint failed — referenced record does not exist',
        errors: [],
      })
    }
    return res.status(400).json({
      success: false,
      message: `Database error [${err.code}]`,
      errors: [],
    })
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data sent to database',
      errors: [],
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errors: [],
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired',
      errors: [],
    })
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body',
      errors: [],
    })
  }

  const statusCode = err.statusCode || 500
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message

  return res.status(statusCode).json({
    success: false,
    message,
    errors: [],
  })
}
