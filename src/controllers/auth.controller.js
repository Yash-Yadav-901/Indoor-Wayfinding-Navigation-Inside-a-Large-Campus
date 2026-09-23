import { registerUser, loginUser } from '../services/auth.service.js'
import { asyncHandler } from '../utils/async_handler.js'
import { ApiError } from '../utils/api_error.js'
import { ApiResponse } from '../utils/api_response.js'

export const register = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required')
  }

  if (role && !['user', 'admin'].includes(role)) {
    throw new ApiError(400, 'Role must be either "user" or "admin"')
  }

  const user = await registerUser(username, password, role)
  res.status(201).json(new ApiResponse(201, user, 'User registered successfully'))
})

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required')
  }

  const { token, user } = await loginUser(username, password)
  res.status(200).json(new ApiResponse(200, { token, user }, 'Login successful'))
})
