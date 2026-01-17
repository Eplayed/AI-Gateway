// 导入 Prisma Client 类型，用于 TypeScript
import { PrismaClient } from '@prisma/client';
import type { Model, ModelProvider, ModelType, ModelCapability } from '@ai-gateway/core';

// 这里只是为了让 TypeScript 能识别类型
// 实际执行使用 index.ts (CommonJS)
export * from '@prisma/client';
export * from '@ai-gateway/core';
