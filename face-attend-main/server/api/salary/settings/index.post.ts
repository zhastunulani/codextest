import { db } from '~/server/db'
import { departmentSalarySettings } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

const ALLOWED_TYPES = new Set(['oklad', 'hourly', 'kpi', 'percent', 'mixed'])

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const body = await readBody(event)

  const type = String(body?.type || '')
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ statusCode: 400, statusMessage: 'type дұрыс емес' })
  }

  const departmentId = user.role === 'head'
    ? user.departmentId
    : Number(body?.departmentId)

  if (!departmentId || departmentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'departmentId қажет' })
  }

  const payload = {
    departmentId,
    type,
    baseSalary: Number(body?.baseSalary || 0),
    hourlyRate: Number(body?.hourlyRate || 0),
    kpiEnabled: Boolean(body?.kpiEnabled),
    kpiWeight: Number(body?.kpiWeight || 0),
    percentRate: Number(body?.percentRate || 0),
    scheduleBased: body?.scheduleBased !== false,
  }

  const [created] = await db.insert(departmentSalarySettings).values(payload).returning()

  await logAudit({
    userId: user.id,
    action: 'DEPARTMENT_SALARY_SETTINGS_CREATED',
    details: { departmentId, type },
  })

  return created
})
