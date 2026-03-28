import { db } from '~/server/db'
import { payroll, attendance, employees, salarySettings } from '~/server/db/schema'
import { eq, like, and } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])
  const body = await readBody(event)
  const { month, year } = body

  if (!month || !year) {
    throw createError({ statusCode: 400, statusMessage: 'Ай мен жыл қажет' })
  }

  const [settings] = await db.select().from(salarySettings)
  if (!settings) throw createError({ statusCode: 500, statusMessage: 'Айлық баптаулары табылмады' })

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  const activeEmployees = await db.select().from(employees).where(eq(employees.isActive, true))

  const results = []

  for (const emp of activeEmployees) {
    const records = await db.select().from(attendance)
      .where(and(eq(attendance.employeeId, emp.id), like(attendance.date, `${monthPrefix}%`)))

    let totalWorkMinutes = 0
    let totalOvertimeMinutes = 0
    let workDays = 0

    for (const r of records) {
      if (r.checkIn && r.checkOut) {
        const [inH, inM] = r.checkIn.split(':').map(Number)
        const [outH, outM] = r.checkOut.split(':').map(Number)
        const worked = (outH * 60 + outM) - (inH * 60 + inM)
        if (worked > 0) {
          totalWorkMinutes += worked
          workDays++
        }
      }
      totalOvertimeMinutes += r.overtimeMinutes
    }

    const workHours = totalWorkMinutes / 60
    const overtimeHours = totalOvertimeMinutes / 60
    const hourlyRate = emp.salaryRate > 0 ? emp.salaryRate / (settings.standardHoursPerDay * 22) : 0
    const baseAmount = workHours * hourlyRate
    const overtimeAmount = overtimeHours * hourlyRate * settings.overtimeCoefficient
    const totalAmount = baseAmount + overtimeAmount

    // Upsert payroll record
    const [existing] = await db.select().from(payroll)
      .where(and(eq(payroll.employeeId, emp.id), eq(payroll.month, month), eq(payroll.year, year)))

    const payrollData = {
      employeeId: emp.id,
      month,
      year,
      workDays,
      workHours: Math.round(workHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      baseAmount: Math.round(baseAmount),
      overtimeAmount: Math.round(overtimeAmount),
      deductions: 0,
      totalAmount: Math.round(totalAmount),
    }

    if (existing) {
      await db.update(payroll).set(payrollData).where(eq(payroll.id, existing.id))
    } else {
      await db.insert(payroll).values(payrollData)
    }

    results.push({ ...payrollData, employeeName: emp.name })
  }

  return { month: monthPrefix, results }
})
