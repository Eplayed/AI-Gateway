import { PrismaClient } from '@prisma/client';
import type { Logger } from '@ai-gateway/logger';

let prismaInstance: PrismaClient | null = null;

export function createPrismaClient(logger?: Logger): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // 开发环境打印 SQL 查询
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger?.debug({
        query: e.query,
        params: e.params,
        duration: e.duration,
      }, 'Prisma Query');
    });
  }

  prismaInstance = client;
  return client;
}

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('PrismaClient not initialized. Call createPrismaClient() first.');
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

export { PrismaClient };
