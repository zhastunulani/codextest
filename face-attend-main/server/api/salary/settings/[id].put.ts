import { db } from '~/server/db'
import { departmentSalarySettings } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

const ALLOWED_TYPES = new Set(['oklad', 'hourly', 'kpi', 'percent', 'mixed'])

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'id дұрыс болуы керек' })
  }

  const [existing] = await db.select().from(departmentSalarySettings).where(eq(departmentSalarySettings.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Жазба табылмады' })
  }

  if (user.role === 'head' && user.departmentId !== existing.departmentId) {
    throw createError({ statusCode: 403, statusMessage: 'Тек өз бөліміңіздің баптауларын өзгерте аласыз' })
  }

  const nextType = body?.type ? String(body.type) : existing.type
  if (!ALLOWED_TYPES.has(nextType)) {
    throw createError({ statusCode: 400, statusMessage: 'type дұрыс емес' })
  }

  const updateData = {
    type: nextType,
    baseSalary: body?.baseSalary === undefined ? existing.baseSalary : Number(body.baseSalary),
    hourlyRate: body?.hourlyRate === undefined ? existing.hourlyRate : Number(body.hourlyRate),
    kpiEnabled: body?.kpiEnabled === undefined ? existing.kpiEnabled : Boolean(body.kpiEnabled),
    kpiWeight: body?.kpiWeight === undefined ? existing.kpiWeight : Number(body.kpiWeight),
    percentRate: body?.percentRate === undefined ? existing.percentRate : Number(body.percentRate),
    scheduleBased: body?.scheduleBased === undefined ? existing.scheduleBased : Boolean(body.scheduleBased),
  }

  const [updated] = await db.update(departmentSalarySettings)
    .set(updateData)
    .where(eq(departmentSalarySettings.id, id))
    .returning()

  await logAudit({
    userId: user.id,
    action: 'DEPARTMENT_SALARY_SETTINGS_UPDATED',
    details: { id, departmentId: existing.departmentId },
  })

  return updated
})
