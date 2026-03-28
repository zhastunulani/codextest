import { db } from '~/server/db'
import { schedules } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  const body = await readBody(event)
  const updateData: Record<string, any> = {}
  if (body.name) updateData.name = body.name.trim()
  if (body.type) updateData.type = body.type
  if (body.workStart) updateData.workStart = body.workStart
  if (body.workEnd) updateData.workEnd = body.workEnd
  if (body.workDays) updateData.workDays = typeof body.workDays === 'string' ? body.workDays : JSON.stringify(body.workDays)

  const result = await db.update(schedules).set(updateData).where(eq(schedules.id, id)).returning()
  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Кесте табылмады' })
  return result[0]
})
