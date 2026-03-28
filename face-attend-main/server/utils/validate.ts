export function normalizeLogin(login: unknown): string {
  if (typeof login !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Логин мәтін болуы керек' })
  }
  const normalized = login.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw createError({ statusCode: 400, statusMessage: 'Логин форматы қате (3-32, a-z, 0-9, . _ -)' })
  }
  return normalized
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Пароль мәтін болуы керек' })
  }
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Пароль 8-128 таңба аралығында болуы керек' })
  }
  return password
}

export function validateDisplayName(name: unknown): string {
  if (typeof name !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Аты мәтін болуы керек' })
  }
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw createError({ statusCode: 400, statusMessage: 'Аты 2-80 таңба аралығында болуы керек' })
  }
  return trimmed
}
