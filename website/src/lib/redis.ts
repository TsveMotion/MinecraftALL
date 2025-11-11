import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, caching disabled')
    return null
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null
          return Math.min(times * 200, 1000)
        },
      })

      redis.on('error', (err) => {
        console.error('Redis connection error:', err)
      })

      redis.on('connect', () => {
        console.log('Redis connected successfully')
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      return null
    }
  }

  return redis
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get(key)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCache(
  key: string,
  value: any,
  expirySeconds: number = 60
): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.setex(key, expirySeconds, JSON.stringify(value))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}
