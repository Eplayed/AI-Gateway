import type { Context, Next } from 'hono';
import { getLogger } from '@ai-gateway/logger';

const logger = getLogger();

export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now();

  logger.info({
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
  }, 'Incoming request');

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
  }, 'Request completed');
}
