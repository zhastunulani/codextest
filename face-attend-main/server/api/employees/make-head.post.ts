import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])
  const body = await readBody(event)

  const userId = Number(body?.userId)

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'userId дұрыс болуы керек' })
  }

  const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId))
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Қолданушы табылмады' })
  }

  if (target.role === 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Admin-ді head қыла алмайсыз' })
  }

  await db.update(users).set({ role: 'head' }).where(eq(users.id, userId))
  await logAudit({ userId: admin.id, action: 'USER_MADE_HEAD', details: { userId } })

  return { success: true, userId, role: 'head' }
})
