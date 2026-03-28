import { db } from '~/server/db'
import { positions } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Лауазым атауы қажет' })
  }

  const result = await db.insert(positions).values({
    name: body.name.trim(),
    departmentId: body.departmentId || null,
  }).returning()
  return result[0]
})
