import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'
import { checkRateLimit, clearRateLimit, consumeRateLimitFailure } from '~/server/utils/rate-limit'
import { logAudit } from '~/server/utils/audit'
import { normalizeLogin, validatePassword } from '~/server/utils/validate'

const MAX_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const login = normalizeLogin(body?.login)
  const password = validatePassword(body?.password)

  const limit = checkRateLimit(event, 'admin-login', MAX_ATTEMPTS, WINDOW_MS, String(login))
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', String(limit.retryAfterSec || 900))
    throw createError({ statusCode: 429, statusMessage: 'Тым көп қате әрекет. Кейінірек қайталап көріңіз.' })
  }

  const [user] = await db.select().from(users)
    .where(and(eq(users.login, login), eq(users.role, 'admin')))

  if (!user || !user.isActive) {
    consumeRateLimitFailure(event, 'admin-login', WINDOW_MS, String(login))
    await logAudit({ action: 'AUTH_ADMIN_LOGIN_FAILED', details: { login } })
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  const valid = bcryptjs.compareSync(password, user.password)
  if (!valid) {
    consumeRateLimitFailure(event, 'admin-login', WINDOW_MS, String(login))
    await logAudit({ userId: user.id, action: 'AUTH_ADMIN_LOGIN_FAILED', details: { login } })
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  clearRateLimit(event, 'admin-login', String(login))

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

  await logAudit({ userId: user.id, action: 'AUTH_ADMIN_LOGIN_SUCCESS' })

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
