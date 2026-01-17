import type { Context, Next } from 'hono';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare module 'hono' {
  interface ContextVariableMap {
    apiKeyId: string;
    apiKey: string;
    userId: string | null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');

  let apiKey = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.slice(7);
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader;
  } else {
    return c.json(
      {
        success: false,
        error: 'Missing API key. Use Authorization: Bearer sk-xxx or X-API-Key header.',
      },
      401,
    );
  }

  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
  });

  if (!apiKeyRecord) {
    return c.json(
      { success: false, error: 'Invalid or inactive API key' },
      401,
    );
  }

  c.set('apiKeyId', apiKeyRecord.id);
  c.set('apiKey', apiKey);
  c.set('userId', apiKeyRecord.userId);

  await next();
}
