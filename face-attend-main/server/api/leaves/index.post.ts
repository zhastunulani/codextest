import { db } from '~/server/db'
import { leaves } from '~/server/db/schema'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const body = await readBody(event)

  if (!body.employeeId || !body.type || !body.startDate || !body.endDate) {
    throw createError({ statusCode: 400, statusMessage: 'Барлық өрістерді толтырыңыз' })
  }

  const result = await db.insert(leaves).values({
    employeeId: body.employeeId,
    type: body.type,
    startDate: body.startDate,
    endDate: body.endDate,
    reason: body.reason || null,
  }).returning()

  return result[0]
})
