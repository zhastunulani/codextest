import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { employees, users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { signToken } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'
import { normalizeLogin, validateDisplayName, validatePassword } from '~/server/utils/validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const login = normalizeLogin(body?.login)
  const password = validatePassword(body?.password)
  const name = validateDisplayName(body?.name)

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

  await db.insert(employees).values({
    userId: created.id,
    name: created.name,
    departmentId: created.departmentId ?? null,
    isActive: true,
  })

  const token = signToken({
    id: created.id,
    login: created.login,
    role: 'employee',
    departmentId: created.departmentId ?? undefined,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  await logAudit({ userId: created.id, action: 'AUTH_REGISTER', details: { login: created.login } })

  return { user: created }
})
