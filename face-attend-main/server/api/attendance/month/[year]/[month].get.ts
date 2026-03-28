import { db } from '~/server/db'
import { attendance, employees } from '~/server/db/schema'
import { eq, like } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const year = getRouterParam(event, 'year')
  const month = getRouterParam(event, 'month')

  if (!year || !month) {
    throw createError({ statusCode: 400, statusMessage: 'Жыл мен ай қажет' })
  }

  const monthPrefix = `${year}-${month.padStart(2, '0')}`

  const records = await db.select({
    id: attendance.id,
    employeeId: attendance.employeeId,
    employeeName: employees.name,
    departmentId: employees.departmentId,
    date: attendance.date,
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    isLate: attendance.isLate,
    lateMinutes: attendance.lateMinutes,
    overtimeMinutes: attendance.overtimeMinutes,
    status: attendance.status,
  })
    .from(attendance)
    .innerJoin(employees, eq(attendance.employeeId, employees.id))
    .where(like(attendance.date, `${monthPrefix}%`))

  // Group by employee
  const grouped: Record<number, any> = {}
  for (const r of records) {
    if (!grouped[r.employeeId]) {
      grouped[r.employeeId] = {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        departmentId: r.departmentId,
        records: [],
        totalWorkMinutes: 0,
        totalOvertimeMinutes: 0,
        totalLateMinutes: 0,
        daysPresent: 0,
        daysLate: 0,
      }
    }
    grouped[r.employeeId].records.push(r)
    grouped[r.employeeId].daysPresent++
    if (r.isLate) grouped[r.employeeId].daysLate++
    grouped[r.employeeId].totalLateMinutes += r.lateMinutes
    grouped[r.employeeId].totalOvertimeMinutes += r.overtimeMinutes

    if (r.checkIn && r.checkOut) {
      const [inH, inM] = r.checkIn.split(':').map(Number)
      const [outH, outM] = r.checkOut.split(':').map(Number)
      grouped[r.employeeId].totalWorkMinutes += (outH * 60 + outM) - (inH * 60 + inM)
    }
  }

  return {
    month: monthPrefix,
    employees: Object.values(grouped),
  }
})
