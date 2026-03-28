import type { H3Event } from 'h3'

interface Entry {
  attempts: number
  firstAttemptAt: number
}

const store = new Map<string, Entry>()

export function checkRateLimit(event: H3Event, keyPrefix: string, maxAttempts: number, windowMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `${keyPrefix}:${ip}`
  const now = Date.now()

  const entry = store.get(key)
  if (!entry) {
    store.set(key, { attempts: 1, firstAttemptAt: now })
    return { allowed: true, attemptsLeft: maxAttempts - 1 }
  }

  if (now - entry.firstAttemptAt > windowMs) {
    store.set(key, { attempts: 1, firstAttemptAt: now })
    return { allowed: true, attemptsLeft: maxAttempts - 1 }
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((windowMs - (now - entry.firstAttemptAt)) / 1000)
    return { allowed: false, attemptsLeft: 0, retryAfterSec }
  }

  entry.attempts += 1
  store.set(key, entry)
  return { allowed: true, attemptsLeft: maxAttempts - entry.attempts }
}
