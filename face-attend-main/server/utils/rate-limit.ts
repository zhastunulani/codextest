import type { H3Event } from 'h3'

interface Entry {
  attempts: number
  firstAttemptAt: number
}

const store = new Map<string, Entry>()

function getKey(event: H3Event, keyPrefix: string, identifier?: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return `${keyPrefix}:${identifier || '-'}:${ip}`
}

export function checkRateLimit(event: H3Event, keyPrefix: string, maxAttempts: number, windowMs: number, identifier?: string) {
  const key = getKey(event, keyPrefix, identifier)
  const now = Date.now()

  const entry = store.get(key)
  if (!entry) {
    return { allowed: true, attemptsLeft: maxAttempts }
  }

  if (now - entry.firstAttemptAt > windowMs) {
    store.delete(key)
    return { allowed: true, attemptsLeft: maxAttempts }
  }

  if (entry.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((windowMs - (now - entry.firstAttemptAt)) / 1000)
    return { allowed: false, attemptsLeft: 0, retryAfterSec }
  }

  return { allowed: true, attemptsLeft: maxAttempts - entry.attempts }
}

export function consumeRateLimitFailure(event: H3Event, keyPrefix: string, windowMs: number, identifier?: string) {
  const key = getKey(event, keyPrefix, identifier)
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || (now - entry.firstAttemptAt > windowMs)) {
    store.set(key, { attempts: 1, firstAttemptAt: now })
    return
  }

  entry.attempts += 1
  store.set(key, entry)
}

export function clearRateLimit(event: H3Event, keyPrefix: string, identifier?: string) {
  const key = getKey(event, keyPrefix, identifier)
  store.delete(key)
}
