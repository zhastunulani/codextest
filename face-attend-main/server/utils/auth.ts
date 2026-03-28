import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

interface JwtPayload {
  id: number
  login: string
  role: 'admin' | 'head' | 'manager'
  departmentId?: number
}

export function signToken(payload: JwtPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}

export function getAuthUser(event: H3Event): JwtPayload | null {
  const token = getCookie(event, 'auth_token')
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(event: H3Event): JwtPayload {
  const user = getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Авторизация қажет' })
  }
  return user
}

export function requireRole(event: H3Event, roles: string[]): JwtPayload {
  const user = requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Рұқсат жоқ' })
  }
  return user
}
