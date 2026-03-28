import bcryptjs from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { oldPassword, newPassword } = body

  if (!oldPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Ескі және жаңа пароль қажет' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Жаңа пароль кемінде 8 таңба болуы керек' })
  }

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
