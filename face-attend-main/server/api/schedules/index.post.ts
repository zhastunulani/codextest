import { db } from '~/server/db'
import { schedules } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)

  if (!body.name?.trim() || !body.type || !body.workStart || !body.workEnd || !body.workDays) {
    throw createError({ statusCode: 400, statusMessage: 'Барлық өрістерді толтырыңыз' })
  }

  const result = await db.insert(schedules).values({
    name: body.name.trim(),
    type: body.type,
    workStart: body.workStart,
    workEnd: body.workEnd,
    workDays: typeof body.workDays === 'string' ? body.workDays : JSON.stringify(body.workDays),
  }).returning()

  return result[0]
})
