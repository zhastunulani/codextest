import { db } from '~/server/db'
import { attendance, employees } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const today = new Date().toISOString().split('T')[0]

  const records = await db.select({
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
    .where(eq(attendance.date, today))

  // Filter by department for head role
  const filtered = user.role === 'head' && user.departmentId
    ? records.filter(r => r.departmentId === user.departmentId)
    : records

  // Get all active employees for absent calculation
  const allEmployees = await db.select({ id: employees.id, name: employees.name, departmentId: employees.departmentId })
    .from(employees).where(eq(employees.isActive, true))

  const presentIds = new Set(filtered.map(r => r.employeeId))
  const relevantEmployees = user.role === 'head' && user.departmentId
    ? allEmployees.filter(e => e.departmentId === user.departmentId)
    : allEmployees
  const absent = relevantEmployees.filter(e => !presentIds.has(e.id))

  return {
    date: today,
    present: filtered,
    absent,
    stats: {
      total: relevantEmployees.length,
      presentCount: filtered.length,
      absentCount: absent.length,
      lateCount: filtered.filter(r => r.isLate).length,
    },
  }
})
