import { db } from '~/server/db'
import { departments } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Бөлім атауы қажет' })
  }

  const result = await db.insert(departments).values({ name: body.name.trim() }).returning()
  return result[0]
})
