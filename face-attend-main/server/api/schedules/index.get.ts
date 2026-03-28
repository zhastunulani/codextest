import { db } from '~/server/db'
import { schedules } from '~/server/db/schema'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  return await db.select().from(schedules)
})
