import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/api_error.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10

export async function registerUser(username, password, role = 'user') {
  if (!JWT_SECRET) throw new ApiError(500, 'JWT_SECRET is not configured')

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) throw new ApiError(409, 'Username already taken')

  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { username, password_hash: hash, role },
    select: { id: true, username: true, role: true }
  })

  return user
}

export async function loginUser(username, password) {
  if (!JWT_SECRET) throw new ApiError(500, 'JWT_SECRET is not configured')

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new ApiError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new ApiError(401, 'Invalid credentials')

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role }
  }
}

export function verifyToken(token) {
  if (!JWT_SECRET) throw new ApiError(500, 'JWT_SECRET is not configured')
  return jwt.verify(token, JWT_SECRET)
}
