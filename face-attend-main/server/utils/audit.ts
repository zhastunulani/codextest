import { db } from '~/server/db'
import { auditLog } from '~/server/db/schema'

interface AuditInput {
  userId?: number
  action: string
  details?: Record<string, any> | string
}

export async function logAudit(input: AuditInput) {
  const details = typeof input.details === 'string'
    ? input.details
    : input.details
      ? JSON.stringify(input.details)
      : null

  await db.insert(auditLog).values({
    userId: input.userId ?? null,
    action: input.action,
    details,
  })
}
