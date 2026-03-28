import { db } from '~/server/db'
import { employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'

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

  // Protected: admin/head only
  const user = requireRole(event, ['admin', 'head'])

  const queryBuilder = db.select({
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

  if (user.role === 'head' && user.departmentId) {
    return await queryBuilder.where(eq(employees.departmentId, user.departmentId))
  }

  if (activeOnly) {
    return await queryBuilder.where(eq(employees.isActive, true))
  }

  return await queryBuilder
})
