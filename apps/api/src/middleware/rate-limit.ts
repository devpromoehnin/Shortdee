/**
 * Per-route rate-limit configs. Attach via a route's `config.rateLimit`.
 * The global limit (100/min) is set in app.ts; AI-backed routes are stricter.
 */
export const aiRateLimit = { max: 10, timeWindow: '1 minute' } as const

export const uploadRateLimit = { max: 20, timeWindow: '1 minute' } as const
