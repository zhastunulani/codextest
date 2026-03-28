import { db } from '~/server/db'
import { employees, users } from '~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event)

  const [user] = await db.select({
    id: users.id,
    login: users.login,
    name: users.name,
    role: users.role,
    departmentId: users.departmentId,
    isActive: users.isActive,
  }).from(users).where(eq(users.id, authUser.id))

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'Авторизация қажет' })
  }

  const [employee] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, authUser.id), eq(employees.isActive, true)))

  return {
    user: {
      ...user,
      employeeId: employee?.id ?? null,
    },
  }
})
