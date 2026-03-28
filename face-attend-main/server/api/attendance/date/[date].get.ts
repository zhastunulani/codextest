import { db } from '~/server/db'
import { attendance, employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin', 'head'])
  const date = getRouterParam(event, 'date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Күн форматы: YYYY-MM-DD' })
  }

  const rows = await db.select({
    id: attendance.id,
    employeeId: attendance.employeeId,
    employeeName: employees.name,
    departmentId: employees.departmentId,
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

  if (user.role === 'head' && user.departmentId) {
    return rows.filter(r => r.departmentId === user.departmentId)
  }

  return rows
})
