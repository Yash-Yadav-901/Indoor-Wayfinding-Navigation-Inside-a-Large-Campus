
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export async function registerUser(username, password, role = 'user') {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) throw new Error('Username already exists')

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password_hash: hash, role }
  })

  return user
}

export async function loginUser(username, password) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new Error('Invalid credentials')

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  return { token, user }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    throw new Error('Invalid token')
  }
}
