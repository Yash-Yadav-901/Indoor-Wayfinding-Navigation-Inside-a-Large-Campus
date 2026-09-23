import Redis from 'ioredis'
import { config } from '../config/index.js'

let redis = null

function getRedis() {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            enableOfflineQueue: false,
        })

        redis.on('connect', () => console.log('[Redis] Connected'))
        redis.on('error', (err) => console.error('[Redis] Error:', err.message))
    }
    return redis
}

export async function cacheGet(key) {
    try {
        const data = await getRedis().get(key)
        return data ? JSON.parse(data) : null
    } catch {
        return null
    }
}

export async function cacheSet(key, value, ttlSeconds) {
    try {
        await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
    }
}

export async function cacheDel(key) {
    try {
        await getRedis().del(key)
    } catch {
    }
}

export async function cacheDelPattern(pattern) {
    try {
        const keys = await getRedis().keys(pattern)
        if (keys.length > 0) await getRedis().del(...keys)
    } catch {
    }
}

export { getRedis }
