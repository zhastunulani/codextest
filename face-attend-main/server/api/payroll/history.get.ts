import { db } from '~/server/db'
import { payroll, employees } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const query = getQuery(event)
  const { month, year } = query

  if (!month || !year) {
    throw createError({ statusCode: 400, statusMessage: 'Ай мен жыл қажет' })
  }

  return await db.select({
    id: payroll.id,
    employeeId: payroll.employeeId,
    employeeName: employees.name,
    departmentId: employees.departmentId,
    month: payroll.month,
    year: payroll.year,
    workDays: payroll.workDays,
    workHours: payroll.workHours,
    overtimeHours: payroll.overtimeHours,
    baseAmount: payroll.baseAmount,
    overtimeAmount: payroll.overtimeAmount,
    deductions: payroll.deductions,
    totalAmount: payroll.totalAmount,
  })
    .from(payroll)
    .innerJoin(employees, eq(payroll.employeeId, employees.id))
    .where(and(eq(payroll.month, Number(month)), eq(payroll.year, Number(year))))
})
