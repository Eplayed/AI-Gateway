import type { Context, Next } from 'hono';
import { createClient } from '@ai-gateway/cache';

// 使用内存存储（生产环境应使用 Redis）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequestsPerWindow: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 分钟
  maxRequestsPerWindow: 100,
};

export async function rateLimitMiddleware(config: RateLimitConfig = DEFAULT_CONFIG) {
  const { windowMs, maxRequestsPerWindow } = config;

  return async (c: Context, next: Next) => {
    const apiKeyId = c.get('apiKeyId');

    // 如果未通过鉴权，跳过限流检查（会被 authMiddleware 拦截）
    if (!apiKeyId) {
      await next();
      return;
    }

    const now = Date.now();
    const key = `rate-limit:${apiKeyId}`;
    const current = requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // 首次请求或窗口已过期，重置计数
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // 增加计数
      current.count++;

      if (current.count > maxRequestsPerWindow) {
        const resetInMs = current.resetTime - now;
        return c.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(resetInMs / 1000),
          },
          429,
        );
      }
    }

    // 添加限流响应头
    c.header('X-RateLimit-Limit', maxRequestsPerWindow.toString());
    c.header('X-RateLimit-Remaining', (maxRequestsPerWindow - (requestCounts.get(key)!.count - 1)).toString());
    c.header('X-RateLimit-Reset', requestCounts.get(key)!.resetTime.toString());

    await next();
  };
}
