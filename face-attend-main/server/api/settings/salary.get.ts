import { db } from '~/server/db'
import { departmentSalarySettings } from '~/server/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const query = getQuery(event)

  const departmentId = user.role === 'head'
    ? user.departmentId
    : Number(query.departmentId)

  if (!departmentId || departmentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'departmentId қажет' })
  }

  const rows = await db.select().from(departmentSalarySettings)
    .where(eq(departmentSalarySettings.departmentId, departmentId))
    .orderBy(desc(departmentSalarySettings.id))

  return rows[0] || null
})
