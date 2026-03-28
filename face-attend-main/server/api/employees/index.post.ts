import { db } from '~/server/db'
import { employees } from '~/server/db/schema'
import { requireRole } from '~/server/utils/auth'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin', 'head'])
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Аты-жөні қажет' })
  }

  let photoPath: string | null = null
  if (body.photo) {
    const uploadsDir = resolve(process.cwd(), 'public/uploads/employees')
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })
    const filename = `emp_${Date.now()}.jpg`
    const base64Data = body.photo.replace(/^data:image\/\w+;base64,/, '')
    writeFileSync(resolve(uploadsDir, filename), Buffer.from(base64Data, 'base64'))
    photoPath = `/uploads/employees/${filename}`
  }

  // Validate face descriptor
  if (body.faceDescriptor) {
    try {
      const arr = JSON.parse(body.faceDescriptor)
      if (!Array.isArray(arr) || arr.length !== 128) {
        throw new Error()
      }
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Face descriptor форматы қате (128 сан қажет)' })
    }
  }

  const result = await db.insert(employees).values({
    name: body.name.trim(),
    departmentId: body.departmentId || null,
    positionId: body.positionId || null,
    photoPath,
    faceDescriptor: body.faceDescriptor || null,
    scheduleId: body.scheduleId || null,
    salaryRate: body.salaryRate || 0,
  }).returning()

  return result[0]
})
