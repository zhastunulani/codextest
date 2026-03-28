import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login, password } = body

  if (!login || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Логин мен пароль қажет' })
  }

  const [user] = await db.select().from(users).where(eq(users.login, login))

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
    role: user.role as 'admin' | 'head' | 'manager',
    departmentId: user.departmentId ?? undefined,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 сағат
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
