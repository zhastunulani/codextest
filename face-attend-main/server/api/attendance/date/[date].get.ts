import { db } from '~/server/db'
import { attendance, employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const date = getRouterParam(event, 'date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Күн форматы: YYYY-MM-DD' })
  }

  return await db.select({
    id: attendance.id,
    employeeId: attendance.employeeId,
    employeeName: employees.name,
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    isLate: attendance.isLate,
    lateMinutes: attendance.lateMinutes,
    overtimeMinutes: attendance.overtimeMinutes,
    status: attendance.status,
  })
    .from(attendance)
    .innerJoin(employees, eq(attendance.employeeId, employees.id))
    .where(eq(attendance.date, date))
})
