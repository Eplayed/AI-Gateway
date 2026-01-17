import type { PrismaClient } from '@prisma/client';
import type { TokenUsage, RequestType } from '@ai-gateway/core';

export class TokenUsageRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<TokenUsage, 'id' | 'timestamp'>): Promise<TokenUsage> {
    const usage = await this.prisma.tokenUsage.create({
      data: {
        apiKeyId: data.apiKey,
        modelId: data.modelId,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        inputCost: data.inputCost,
        outputCost: data.outputCost,
        totalCost: data.totalCost,
        requestType: data.requestType,
        metadata: data.metadata as any,
      },
    });

    return {
      id: usage.id,
      apiKey: usage.apiKeyId,
      modelId: usage.modelId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      inputCost: usage.inputCost,
      outputCost: usage.outputCost,
      totalCost: usage.totalCost,
      timestamp: usage.timestamp.getTime(),
      requestType: usage.requestType as RequestType,
      metadata: usage.metadata as Record<string, unknown>,
    };
  }

  async getByApiKey(apiKey: string, startDate?: Date, endDate?: Date): Promise<TokenUsage[]> {
    const usages = await this.prisma.tokenUsage.findMany({
      where: {
        apiKeyId: apiKey,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return usages.map((u) => ({
      id: u.id,
      apiKey: u.apiKeyId,
      modelId: u.modelId,
      promptTokens: u.promptTokens,
      completionTokens: u.completionTokens,
      totalTokens: u.totalTokens,
      inputCost: u.inputCost,
      outputCost: u.outputCost,
      totalCost: u.totalCost,
      timestamp: u.timestamp.getTime(),
      requestType: u.requestType as RequestType,
      metadata: u.metadata as Record<string, unknown>,
    }));
  }

  async getByModel(modelId: string, startDate?: Date, endDate?: Date): Promise<TokenUsage[]> {
    const usages = await this.prisma.tokenUsage.findMany({
      where: {
        modelId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return usages.map((u) => ({
      id: u.id,
      apiKey: u.apiKeyId,
      modelId: u.modelId,
      promptTokens: u.promptTokens,
      completionTokens: u.completionTokens,
      totalTokens: u.totalTokens,
      inputCost: u.inputCost,
      outputCost: u.outputCost,
      totalCost: u.totalCost,
      timestamp: u.timestamp.getTime(),
      requestType: u.requestType as RequestType,
      metadata: u.metadata as Record<string, unknown>,
    }));
  }

  async getAggregatedStats(
    apiKey: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    avgCostPerRequest: number;
  }> {
    const result = await this.prisma.tokenUsage.aggregate({
      where: {
        apiKeyId: apiKey,
        timestamp: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalTokens: true,
        totalCost: true,
      },
      _count: true,
    });

    const totalTokens = result._sum.totalTokens ?? 0;
    const totalCost = result._sum.totalCost ?? 0;
    const requestCount = result._count;

    return {
      totalTokens,
      totalCost,
      requestCount,
      avgCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
    };
  }
}
