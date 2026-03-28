import { getAuthUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Авторизация қажет' })
  }
  return { user }
})
