/**
 * Simple In-Memory Rate Limiter
 * 
 * Note: In a production environment with multiple server instances,
 * you should use a distributed store like Redis (e.g., Upstash for Vercel).
 */

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(ip: string, limit: number = 50, duration: number = 60000) {
    const now = Date.now();
    const key = `rl:${ip}`;

    const entry = rateLimitMap.get(key);

    if (!entry) {
        rateLimitMap.set(key, { count: 1, lastReset: now });
        return { success: true, remaining: limit - 1 };
    }

    if (now - entry.lastReset > duration) {
        entry.count = 1;
        entry.lastReset = now;
        return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
}
