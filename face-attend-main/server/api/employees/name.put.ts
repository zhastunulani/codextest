import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'
import { validateDisplayName } from '~/server/utils/validate'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const authUser = requireAuth(event)
  const body = await readBody(event)
  const name = validateDisplayName(body?.name)

  await db.update(users).set({ name }).where(eq(users.id, authUser.id))
  await logAudit({ userId: authUser.id, action: 'PROFILE_NAME_UPDATED' })

  return { success: true, name }
})
