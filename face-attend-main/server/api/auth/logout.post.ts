import { getAuthUser } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  if (user) {
    await logAudit({ userId: user.id, action: 'AUTH_LOGOUT' })
  }
  deleteCookie(event, 'auth_token', { path: '/' })
  return { success: true }
})
