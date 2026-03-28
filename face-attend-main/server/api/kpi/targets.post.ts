import { db } from '~/server/db'
import { kpiTargets } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)

  if (!body.departmentId || !body.metric || !body.targetValue || !body.period) {
    throw createError({ statusCode: 400, statusMessage: 'Барлық өрістерді толтырыңыз' })
  }

  const result = await db.insert(kpiTargets).values({
    departmentId: body.departmentId,
    metric: body.metric,
    targetValue: body.targetValue,
    period: body.period,
  }).returning()

  return result[0]
})
