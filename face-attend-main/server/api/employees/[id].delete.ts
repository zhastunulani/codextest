import { db } from '~/server/db'
import { employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  // Soft delete
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, id))
  return { success: true }
})
