import { db } from '~/server/db'
import { kpiTargets } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const body = await readBody(event)

  if (!body.metric || !body.targetValue || !body.period) {
    throw createError({ statusCode: 400, statusMessage: 'metric, targetValue, period қажет' })
  }

  const departmentId = user.role === 'head'
    ? user.departmentId
    : Number(body.departmentId)

  if (!departmentId) {
    throw createError({ statusCode: 400, statusMessage: 'departmentId қажет' })
  }

  const result = await db.insert(kpiTargets).values({
    departmentId,
    metric: body.metric,
    targetValue: body.targetValue,
    period: body.period,
  }).returning()

  return result[0]
})
