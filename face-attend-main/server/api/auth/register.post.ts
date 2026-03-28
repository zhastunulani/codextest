import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login, password, name } = body

  if (!login || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Логин, пароль және аты қажет' })
  }

  if (String(password).length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Пароль кемінде 8 таңба болуы керек' })
  }

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.login, login))
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'Бұл логин бос емес' })
  }

  const hash = bcryptjs.hashSync(password, 10)
  const [created] = await db.insert(users).values({
    login,
    password: hash,
    name,
    role: 'employee',
  }).returning({
    id: users.id,
    login: users.login,
    name: users.name,
    role: users.role,
    departmentId: users.departmentId,
  })

  const token = signToken({
    id: created.id,
    login: created.login,
    role: created.role as 'employee',
    departmentId: created.departmentId ?? undefined,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return { user: created }
})
