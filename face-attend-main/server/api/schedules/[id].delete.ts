import { db } from '~/server/db'
import { schedules } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  await db.delete(schedules).where(eq(schedules.id, id))
  return { success: true }
})
