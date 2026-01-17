import type { Context, Next } from 'hono';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 将 apiKey 信息附加到 Context
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

  // 支持两种方式：Authorization: Bearer sk-xxx 或 X-API-Key: sk-xxx
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

  // 验证 API Key
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
  });

  if (!apiKeyRecord) {
    return c.json(
      { success: false, error: 'Invalid or inactive API key' },
      401,
    );
  }

  // 附加到 Context
  c.set('apiKeyId', apiKeyRecord.id);
  c.set('apiKey', apiKey);
  c.set('userId', apiKeyRecord.userId);

  await next();
}
