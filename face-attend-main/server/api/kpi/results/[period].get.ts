import { db } from '~/server/db'
import { kpiTargets, kpiResults, attendance, employees, departments } from '~/server/db/schema'
import { eq, like, and } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const period = getRouterParam(event, 'period') // e.g. "2026-03"
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Кезең форматы: YYYY-MM' })
  }

  const allDepts = await db.select().from(departments)
  const targets = await db.select().from(kpiTargets).where(eq(kpiTargets.period, period))

  const results = []

  for (const dept of allDepts) {
    const deptEmployees = await db.select().from(employees)
      .where(and(eq(employees.departmentId, dept.id), eq(employees.isActive, true)))

    if (deptEmployees.length === 0) continue

    // Calculate attendance rate
    let totalPresent = 0
    let totalExpected = 0
    let totalOvertimeMin = 0
    let totalLateCount = 0

    for (const emp of deptEmployees) {
      const records = await db.select().from(attendance)
        .where(and(eq(attendance.employeeId, emp.id), like(attendance.date, `${period}%`)))
      totalPresent += records.filter(r => r.checkIn).length
      totalExpected += 22 // approximate working days
      totalOvertimeMin += records.reduce((sum, r) => sum + r.overtimeMinutes, 0)
      totalLateCount += records.filter(r => r.isLate).length
    }

    const attendanceRate = totalExpected > 0 ? (totalPresent / totalExpected) * 100 : 0
    const avgOvertimeHours = deptEmployees.length > 0 ? (totalOvertimeMin / 60) / deptEmployees.length : 0

    const deptTargets = targets.filter(t => t.departmentId === dept.id)

    results.push({
      departmentId: dept.id,
      departmentName: dept.name,
      employeeCount: deptEmployees.length,
      metrics: {
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        avgOvertimeHours: Math.round(avgOvertimeHours * 10) / 10,
        totalLateCount,
      },
      targets: deptTargets,
    })
  }

  return { period, departments: results }
})
