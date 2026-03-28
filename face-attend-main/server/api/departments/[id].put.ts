import { db } from '~/server/db'
import { departments } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  const body = await readBody(event)
  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Бөлім атауы қажет' })
  }

  const result = await db.update(departments).set({ name: body.name.trim() }).where(eq(departments.id, id)).returning()
  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Бөлім табылмады' })
  return result[0]
})
