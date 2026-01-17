import { TokenUsageRepository } from '@ai-gateway/infrastructure';
import { PrismaClient } from '@prisma/client';
import type { Context } from 'hono';

const prisma = new PrismaClient();
const tokenUsageRepository = new TokenUsageRepository(prisma);

export class UsageController {
  async getTokenUsage(c: Context) {
    try {
      const apiKeyId = c.get('apiKeyId');

      const startDate = c.req.query('start')
        ? new Date(c.req.query('start')!)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认 30 天
      const endDate = c.req.query('end')
        ? new Date(c.req.query('end')!)
        : new Date();

      const usages = await tokenUsageRepository.getByApiKey(
        apiKeyId,
        startDate,
        endDate,
      );

      const stats = await tokenUsageRepository.getAggregatedStats(
        apiKeyId,
        startDate,
        endDate,
      );

      return c.json({
        success: true,
        data: {
          usages,
          stats,
        },
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getCost(c: Context) {
    try {
      const apiKeyId = c.get('apiKeyId');

      const startDate = c.req.query('start')
        ? new Date(c.req.query('start')!)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = c.req.query('end')
        ? new Date(c.req.query('end')!)
        : new Date();

      const stats = await tokenUsageRepository.getAggregatedStats(
        apiKeyId,
        startDate,
        endDate,
      );

      return c.json({
        success: true,
        data: {
          totalTokens: stats.totalTokens,
          totalCost: stats.totalCost,
          requestCount: stats.requestCount,
          avgCostPerRequest: stats.avgCostPerRequest,
          currency: 'CNY',
        },
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
