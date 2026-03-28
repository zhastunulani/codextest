import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/utils/rate-limit'

const MAX_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000

export default defineEventHandler(async (event) => {
  const limit = checkRateLimit(event, 'admin-login', MAX_ATTEMPTS, WINDOW_MS)
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', String(limit.retryAfterSec || 900))
    throw createError({ statusCode: 429, statusMessage: 'Тым көп қате әрекет. Кейінірек қайталап көріңіз.' })
  }

  const body = await readBody(event)
  const { login, password } = body

  if (!login || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Логин мен пароль қажет' })
  }

  const [user] = await db.select().from(users)
    .where(and(eq(users.login, login), eq(users.role, 'admin')))

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  const valid = bcryptjs.compareSync(password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  const token = signToken({
    id: user.id,
    login: user.login,
    role: 'admin',
    departmentId: user.departmentId ?? undefined,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return {
    user: {
      id: user.id,
      login: user.login,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
  }
})
