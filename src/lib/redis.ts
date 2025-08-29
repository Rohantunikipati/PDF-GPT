import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Helper functions
export async function cacheEmbedding(key: string, embedding: number[], ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(embedding))
}

export async function getCachedEmbedding(key: string): Promise<number[] | null> {
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached as string) : null
}

export async function rateLimitUser(userId: string, limit = 10, window = 60) {
  const key = `ratelimit:${userId}`
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }
  return current <= limit
}