/**
 * Persistent Rate Limiter using Upstash Redis
 *
 * This replaces the in-memory rate limiter with a persistent, distributed solution
 * that works across multiple server instances.
 *
 * Setup:
 * 1. Create account at https://upstash.com (free tier available)
 * 2. Create a Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = Redis.fromEnv();

/**
 * Create a rate limiter for the find-movie endpoint
 * 10 requests per 60 seconds per IP
 */
export const createMovieRateLimiter = () => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:find-movie',
  });
};

/**
 * Get client IP from request headers
 * Handles proxies (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work well with proxies)
  return 'unknown';
}

/**
 * Check if request is rate limited
 * Returns { success: boolean, remaining: number, resetAfter: number }
 */
export async function checkRateLimit(identifier: string) {
  try {
    const ratelimit = createMovieRateLimiter();
    const result = await ratelimit.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request through (fail open) but log it
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: new Date(),
      pending: Promise.resolve(),
    };
  }
}

/**
 * Alternative: Manual implementation with Upstash Redis
 * Use this if you prefer more control
 */
export async function checkRateLimitManual(identifier: string, limit = 10, windowSeconds = 60) {
  try {
    const key = `rate:${identifier}`;
    const now = Date.now();

    // Increment counter
    const count = await redis.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const success = count <= limit;
    const remaining = Math.max(0, limit - count);
    const ttl = await redis.ttl(key);

    return {
      success,
      remaining,
      resetAfter: ttl * 1000, // Convert to ms
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      success: true,
      remaining: limit,
      resetAfter: 0,
    };
  }
}
