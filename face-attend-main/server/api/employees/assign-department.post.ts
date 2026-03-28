import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
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

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId))
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Қолданушы табылмады' })
  }

  await db.update(users).set({ departmentId }).where(eq(users.id, userId))
  await logAudit({ userId: admin.id, action: 'EMPLOYEE_ASSIGNED_DEPARTMENT', details: { userId, departmentId } })

  return { success: true, userId, departmentId }
})
