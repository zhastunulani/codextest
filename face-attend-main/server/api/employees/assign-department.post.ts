import { db } from '~/server/db'
import { employees, users } from '~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])
  const body = await readBody(event)

  const userId = Number(body?.userId)
  const departmentId = Number(body?.departmentId)

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(departmentId) || departmentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'userId және departmentId дұрыс болуы керек' })
  }

  const [targetUser] = await db.select({ id: users.id, role: users.role, name: users.name }).from(users).where(eq(users.id, userId))
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Қолданушы табылмады' })
  }

  if (targetUser.role === 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Admin-ді бөлімге бекітуге болмайды' })
  }

  await db.update(users).set({ departmentId }).where(eq(users.id, userId))

  const [existingEmployee] = await db.select({ id: employees.id }).from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.isActive, true)))

  if (existingEmployee) {
    await db.update(employees).set({ departmentId }).where(eq(employees.id, existingEmployee.id))
  } else {
    await db.insert(employees).values({
      userId,
      name: targetUser.name,
      departmentId,
      isActive: true,
    })
  }

  await logAudit({ userId: admin.id, action: 'EMPLOYEE_ASSIGNED_DEPARTMENT', details: { userId, departmentId } })

  return { success: true, userId, departmentId }
})
