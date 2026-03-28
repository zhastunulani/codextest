import { db } from '~/server/db'
import { departmentSalarySettings } from '~/server/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

const ALLOWED_TYPES = new Set(['oklad', 'hourly', 'kpi', 'percent', 'mixed'])

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const body = await readBody(event)

  const departmentId = user.role === 'head'
    ? user.departmentId
    : Number(body?.departmentId)

  if (!departmentId || departmentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'departmentId қажет' })
  }

  const type = body?.type ? String(body.type) : 'oklad'
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ statusCode: 400, statusMessage: 'type дұрыс емес' })
  }

  const [latest] = await db.select().from(departmentSalarySettings)
    .where(eq(departmentSalarySettings.departmentId, departmentId))
    .orderBy(desc(departmentSalarySettings.id))

  const payload = {
    departmentId,
    type,
    baseSalary: Number(body?.baseSalary ?? latest?.baseSalary ?? 0),
    hourlyRate: Number(body?.hourlyRate ?? latest?.hourlyRate ?? 0),
    kpiEnabled: body?.kpiEnabled === undefined ? (latest?.kpiEnabled ?? false) : Boolean(body.kpiEnabled),
    kpiWeight: Number(body?.kpiWeight ?? latest?.kpiWeight ?? 0),
    percentRate: Number(body?.percentRate ?? latest?.percentRate ?? 0),
    scheduleBased: body?.scheduleBased === undefined ? (latest?.scheduleBased ?? true) : Boolean(body.scheduleBased),
  }

  const [created] = await db.insert(departmentSalarySettings).values(payload).returning()

  await logAudit({
    userId: user.id,
    action: 'DEPARTMENT_SALARY_SETTINGS_LEGACY_UPSERT',
    details: { departmentId, settingId: created.id },
  })

  return created
})
