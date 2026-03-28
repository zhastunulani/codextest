import { db } from '~/server/db'
import { employees, users } from '~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])
  const body = await readBody(event)

  const userId = Number(body?.userId)
  const departmentId = body?.departmentId !== undefined ? Number(body.departmentId) : undefined

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'userId дұрыс болуы керек' })
  }

  const [target] = await db.select({
    id: users.id,
    role: users.role,
    name: users.name,
    departmentId: users.departmentId,
  }).from(users).where(eq(users.id, userId))

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Қолданушы табылмады' })
  }

  if (target.role === 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Admin-ді head қыла алмайсыз' })
  }

  const nextDepartmentId = Number.isInteger(departmentId) && departmentId! > 0
    ? departmentId
    : target.departmentId

  await db.update(users).set({ role: 'head', departmentId: nextDepartmentId ?? null }).where(eq(users.id, userId))

  const [existingEmployee] = await db.select({ id: employees.id }).from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.isActive, true)))

  if (existingEmployee) {
    await db.update(employees)
      .set({ departmentId: nextDepartmentId ?? null, name: target.name })
      .where(eq(employees.id, existingEmployee.id))
  } else {
    await db.insert(employees).values({
      userId,
      name: target.name,
      departmentId: nextDepartmentId ?? null,
      isActive: true,
    })
  }

  await logAudit({
    userId: admin.id,
    action: 'USER_MADE_HEAD',
    details: { userId, departmentId: nextDepartmentId ?? null },
  })

  return { success: true, userId, role: 'head', departmentId: nextDepartmentId ?? null }
})
