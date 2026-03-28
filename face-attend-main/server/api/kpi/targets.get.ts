import { db } from '~/server/db'
import { kpiTargets, departments } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  return await db.select({
    id: kpiTargets.id,
    departmentId: kpiTargets.departmentId,
    departmentName: departments.name,
    metric: kpiTargets.metric,
    targetValue: kpiTargets.targetValue,
    period: kpiTargets.period,
  })
    .from(kpiTargets)
    .leftJoin(departments, eq(kpiTargets.departmentId, departments.id))
})
