import { db } from '~/server/db'
import { salarySettings } from '~/server/db/schema'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const [settings] = await db.select().from(salarySettings)
  return settings
})
