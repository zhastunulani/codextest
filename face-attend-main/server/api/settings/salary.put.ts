import { db } from '~/server/db'
import { salarySettings } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)

  const [existing] = await db.select().from(salarySettings)
  if (!existing) throw createError({ statusCode: 500, statusMessage: 'Баптаулар табылмады' })

  const result = await db.update(salarySettings).set({
    overtimeCoefficient: body.overtimeCoefficient ?? existing.overtimeCoefficient,
    weekendCoefficient: body.weekendCoefficient ?? existing.weekendCoefficient,
    standardHoursPerDay: body.standardHoursPerDay ?? existing.standardHoursPerDay,
    updatedAt: new Date().toISOString(),
  }).where(eq(salarySettings.id, existing.id)).returning()

  return result[0]
})
