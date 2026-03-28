import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'
import { normalizeLogin, validatePassword } from '~/server/utils/validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const login = normalizeLogin(body?.login)
  const password = validatePassword(body?.password)

  const [user] = await db.select().from(users).where(eq(users.login, login))

  if (!user || !user.isActive || user.role === 'admin') {
    await logAudit({ action: 'AUTH_LOGIN_FAILED', details: { login } })
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  const valid = bcryptjs.compareSync(password, user.password)
  if (!valid) {
    await logAudit({ userId: user.id, action: 'AUTH_LOGIN_FAILED', details: { login } })
    throw createError({ statusCode: 401, statusMessage: 'Логин немесе пароль қате' })
  }

  const token = signToken({
    id: user.id,
    login: user.login,
    role: user.role as 'head' | 'employee',
    departmentId: user.departmentId ?? undefined,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  await logAudit({ userId: user.id, action: 'AUTH_LOGIN_SUCCESS' })

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
