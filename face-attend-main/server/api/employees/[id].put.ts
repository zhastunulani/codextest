import { db } from '~/server/db'
import { employees } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole } from '~/server/utils/auth'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'head'])
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, statusMessage: 'ID қате' })

  const body = await readBody(event)

  const [existing] = await db.select().from(employees).where(eq(employees.id, id))
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Қызметкер табылмады' })

  let photoPath = existing.photoPath
  if (body.photo) {
    const uploadsDir = resolve(process.cwd(), 'public/uploads/employees')
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })
    const filename = `emp_${Date.now()}.jpg`
    const base64Data = body.photo.replace(/^data:image\/\w+;base64,/, '')
    writeFileSync(resolve(uploadsDir, filename), Buffer.from(base64Data, 'base64'))
    photoPath = `/uploads/employees/${filename}`
  }

  const updateData: Record<string, any> = {}
  if (body.name !== undefined) updateData.name = body.name.trim()
  if (body.departmentId !== undefined) updateData.departmentId = body.departmentId || null
  if (body.positionId !== undefined) updateData.positionId = body.positionId || null
  if (body.scheduleId !== undefined) updateData.scheduleId = body.scheduleId || null
  if (body.salaryRate !== undefined) updateData.salaryRate = body.salaryRate
  if (body.isActive !== undefined) updateData.isActive = body.isActive
  if (body.faceDescriptor !== undefined) updateData.faceDescriptor = body.faceDescriptor || existing.faceDescriptor
  if (photoPath !== existing.photoPath) updateData.photoPath = photoPath

  const result = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning()
  return result[0]
})
