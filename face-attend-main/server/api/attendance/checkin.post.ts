import { db } from '~/server/db'
import { attendance, employees, schedules } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { employeeId, type, photo } = body

  if (!employeeId || !type) {
    throw createError({ statusCode: 400, statusMessage: 'employee_id және type қажет' })
  }

  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId))
  if (!employee || !employee.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Қызметкер табылмады' })
  }

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().split(' ')[0] // HH:MM:SS

  // Save photo
  let photoPath: string | null = null
  if (photo) {
    const { writeFileSync, existsSync, mkdirSync } = await import('fs')
    const { resolve } = await import('path')
    const uploadsDir = resolve(process.cwd(), 'public/uploads/checkins')
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })
    const filename = `checkin_${employeeId}_${Date.now()}.jpg`
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '')
    writeFileSync(resolve(uploadsDir, filename), Buffer.from(base64Data, 'base64'))
    photoPath = `/uploads/checkins/${filename}`
  }

  // Check existing record for today
  const [existing] = await db.select().from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date)))

  // Check-in
  if (type === 'in') {
    if (existing?.checkIn) {
      return { success: false, message: 'Бүгін check-in жазылған', time: existing.checkIn }
    }

    // Calculate lateness
    let isLate = false
    let lateMinutes = 0
    if (employee.scheduleId) {
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, employee.scheduleId))
      if (schedule) {
        const [schedH, schedM] = schedule.workStart.split(':').map(Number)
        const [nowH, nowM] = time.split(':').map(Number)
        const schedMin = schedH * 60 + schedM
        const nowMin = nowH * 60 + nowM
        if (nowMin > schedMin) {
          isLate = true
          lateMinutes = nowMin - schedMin
        }
      }
    }

    if (existing) {
      await db.update(attendance).set({
        checkIn: time, checkInPhoto: photoPath, isLate, lateMinutes, status: 'present',
      }).where(eq(attendance.id, existing.id))
    } else {
      await db.insert(attendance).values({
        employeeId, date, checkIn: time, checkInPhoto: photoPath, isLate, lateMinutes, status: 'present',
      })
    }

    return {
      success: true,
      employeeName: employee.name,
      type: 'in',
      time,
      isLate,
      lateMinutes,
      message: isLate ? `${employee.name} — кешігу: ${lateMinutes} мин` : `${employee.name} — келді`,
    }
  }

  // Check-out
  if (type === 'out') {
    if (!existing?.checkIn) {
      throw createError({ statusCode: 400, statusMessage: 'Алдымен check-in жасаңыз' })
    }
    if (existing.checkOut) {
      return { success: false, message: 'Бүгін check-out жазылған', time: existing.checkOut }
    }

    // 30-minute minimum check
    const [inH, inM] = existing.checkIn.split(':').map(Number)
    const [outH, outM] = time.split(':').map(Number)
    const workedMin = (outH * 60 + outM) - (inH * 60 + inM)
    if (workedMin < 30 && workedMin >= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Check-in мен check-out арасы кемінде 30 минут болуы керек' })
    }

    // Calculate overtime
    let overtimeMinutes = 0
    if (employee.scheduleId) {
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, employee.scheduleId))
      if (schedule) {
        const [endH, endM] = schedule.workEnd.split(':').map(Number)
        const schedEndMin = endH * 60 + endM
        const outMin = outH * 60 + outM
        if (outMin > schedEndMin) {
          overtimeMinutes = outMin - schedEndMin
        }
      }
    }

    await db.update(attendance).set({
      checkOut: time, checkOutPhoto: photoPath, overtimeMinutes,
    }).where(eq(attendance.id, existing.id))

    return {
      success: true,
      employeeName: employee.name,
      type: 'out',
      time,
      overtimeMinutes,
      message: overtimeMinutes > 0
        ? `${employee.name} — кетті (переработка: ${overtimeMinutes} мин)`
        : `${employee.name} — кетті`,
    }
  }

  throw createError({ statusCode: 400, statusMessage: 'type "in" немесе "out" болуы керек' })
})
