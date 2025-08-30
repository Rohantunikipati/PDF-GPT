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
  if (!cached) return null

  try {
    return JSON.parse(cached as string) as number[]
  } catch (err) {
    console.warn(`Failed to parse cached embedding for key ${key}:`, err)
    return null
  }
}


export async function rateLimitUser(userId: string, limit = 10, window = 60) {
  const key = `ratelimit:${userId}`
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }
  return current <= limit
}

// File management helpers
export async function getUserFiles(userId: string) {
  const fileIds = await redis.lrange(`files:${userId}`, 0, -1)
  const files = []
  
  for (const fileId of fileIds) {
    const fileData = await redis.get(`file:${userId}:${fileId}`)
    if (fileData) {
      files.push(JSON.parse(fileData as string))
    }
  }
  
  return files
}

export async function deleteUserFile(userId: string, fileId: string) {
  // Remove from user's file list
  await redis.lrem(`files:${userId}`, 0, fileId)
  
  // Delete file metadata
  await redis.del(`file:${userId}:${fileId}`)
}