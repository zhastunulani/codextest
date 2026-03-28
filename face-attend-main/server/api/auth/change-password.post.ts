import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'
import { validatePassword } from '~/server/utils/validate'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const oldPassword = validatePassword(body?.oldPassword)
  const newPassword = validatePassword(body?.newPassword)

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))
  if (!dbUser) {
    throw createError({ statusCode: 404, statusMessage: 'Қолданушы табылмады' })
  }

  const valid = bcryptjs.compareSync(oldPassword, dbUser.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Ескі пароль қате' })
  }

  const hash = bcryptjs.hashSync(newPassword, 10)
  await db.update(users).set({ password: hash }).where(eq(users.id, user.id))

  return { success: true }
})
