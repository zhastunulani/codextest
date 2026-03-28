import { db } from '~/server/db'
import { employees, departments, positions } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const withFace = query.withFace === 'true'
  const activeOnly = query.active !== 'false'

  // Public endpoint for face scanning (no auth needed)
  if (withFace) {
    const result = await db.select({
      id: employees.id,
      name: employees.name,
      faceDescriptor: employees.faceDescriptor,
      departmentId: employees.departmentId,
    }).from(employees).where(eq(employees.isActive, true))
    return result.filter(e => e.faceDescriptor)
  }

  // Protected: full employee list
  const user = getAuthUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Авторизация қажет' })

  let query_builder = db.select({
    id: employees.id,
    name: employees.name,
    departmentId: employees.departmentId,
    positionId: employees.positionId,
    photoPath: employees.photoPath,
    scheduleId: employees.scheduleId,
    salaryRate: employees.salaryRate,
    vacationDaysLeft: employees.vacationDaysLeft,
    isActive: employees.isActive,
    createdAt: employees.createdAt,
  }).from(employees)

  // Head sees only their department
  if (user.role === 'head' && user.departmentId) {
    return await query_builder.where(eq(employees.departmentId, user.departmentId))
  }

  if (activeOnly) {
    return await query_builder.where(eq(employees.isActive, true))
  }

  return await query_builder
})
