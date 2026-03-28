import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  return await db.select({
    id: users.id,
    login: users.login,
    name: users.name,
    role: users.role,
    departmentId: users.departmentId,
  }).from(users)
    .where(and(eq(users.role, 'employee'), isNull(users.departmentId)))
})
