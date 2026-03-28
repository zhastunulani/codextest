import { db } from '~/server/db'
import { leaves, employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  const body = await readBody(event)
  if (!body.status || !['approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Статус: approved немесе rejected' })
  }

  // If approved vacation, deduct days
  if (body.status === 'approved') {
    const [leave] = await db.select().from(leaves).where(eq(leaves.id, id))
    if (leave && leave.type === 'vacation') {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const [emp] = await db.select().from(employees).where(eq(employees.id, leave.employeeId))
      if (emp) {
        await db.update(employees).set({
          vacationDaysLeft: Math.max(0, emp.vacationDaysLeft - days),
        }).where(eq(employees.id, leave.employeeId))
      }
    }
  }

  const result = await db.update(leaves).set({
    status: body.status,
    approvedBy: user.id,
  }).where(eq(leaves.id, id)).returning()

  if (!result.length) throw createError({ statusCode: 404, statusMessage: 'Сұраныс табылмады' })
  return result[0]
})
