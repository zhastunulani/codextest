import { db } from '~/server/db'
import { departmentSalarySettings } from '~/server/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const departmentId = Number(getRouterParam(event, 'departmentId'))

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'departmentId дұрыс болуы керек' })
  }

  if (user.role === 'head' && user.departmentId !== departmentId) {
    throw createError({ statusCode: 403, statusMessage: 'Тек өз бөліміңіздің баптауларын көре аласыз' })
  }

  const rows = await db.select().from(departmentSalarySettings)
    .where(eq(departmentSalarySettings.departmentId, departmentId))
    .orderBy(desc(departmentSalarySettings.id))

  return rows[0] || null
})
