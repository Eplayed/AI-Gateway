import { DashScopeModelAdapter } from '@ai-gateway/model-adapter';
import { TokenUsageRepository } from '@ai-gateway/infrastructure';
import { PrismaClient } from '@prisma/client';
import type { RequestType } from '@ai-gateway/core';

const prisma = new PrismaClient();
const tokenUsageRepository = new TokenUsageRepository(prisma);

export class InferenceService {
  private adapter: DashScopeModelAdapter;

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY || '';
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY is not set');
    }

    this.adapter = new DashScopeModelAdapter(apiKey, {
      endpoint: process.env.DASHSCOPE_ENDPOINT,
      region: process.env.DASHSCOPE_REGION,
    });
  }

  async chat(messages: Array<{ role: string; content: string }>, config?: any, apiKeyId?: string) {
    const modelId = config?.model || 'qwen-turbo';

    // 调用模型
    const result = await this.adapter.chat({
      model: modelId,
      messages,
      config: {
        temperature: config?.temperature,
        topP: config?.topP,
        maxTokens: config?.maxTokens,
      },
    });

    // 记录 Token 使用
    if (apiKeyId) {
      await tokenUsageRepository.create({
        apiKey: apiKeyId,
        modelId: modelId,
        promptTokens: result.tokens.promptTokens,
        completionTokens: result.tokens.completionTokens,
        totalTokens: result.tokens.totalTokens,
        inputCost: (result.tokens.promptTokens / 1000) * 0.0008,
        outputCost: (result.tokens.completionTokens / 1000) * 0.0008,
        totalCost:
          (result.tokens.promptTokens / 1000) * 0.0008 +
          (result.tokens.completionTokens / 1000) * 0.0008,
        requestType: 'chat' as RequestType,
      });
    }

    return result;
  }

  async textGeneration(prompt: string, config?: any, apiKeyId?: string) {
    const modelId = config?.model || 'qwen-turbo';

    const result = await this.adapter.textGeneration({
      model: modelId,
      prompt,
      config: {
        temperature: config?.temperature,
        topP: config?.topP,
        maxTokens: config?.maxTokens,
      },
    });

    if (apiKeyId) {
      await tokenUsageRepository.create({
        apiKey: apiKeyId,
        modelId: modelId,
        promptTokens: result.tokens.promptTokens,
        completionTokens: result.tokens.completionTokens,
        totalTokens: result.tokens.totalTokens,
        inputCost: (result.tokens.promptTokens / 1000) * 0.0008,
        outputCost: (result.tokens.completionTokens / 1000) * 0.0008,
        totalCost:
          (result.tokens.promptTokens / 1000) * 0.0008 +
          (result.tokens.completionTokens / 1000) * 0.0008,
        requestType: 'text_generation' as RequestType,
      });
    }

    return result;
  }

  async imageAnalysis(
    image: { type: 'url' | 'base64'; data: string },
    prompt: string,
    config?: any,
    apiKeyId?: string,
  ) {
    const modelId = config?.model || 'qwen-vl-plus';

    const result = await this.adapter.imageAnalysis({
      model: modelId,
      image,
      prompt,
      config: {
        temperature: config?.temperature,
        topP: config?.topP,
        maxTokens: config?.maxTokens,
      },
    });

    if (apiKeyId) {
      await tokenUsageRepository.create({
        apiKey: apiKeyId,
        modelId: modelId,
        promptTokens: result.tokens?.promptTokens || 0,
        completionTokens: result.tokens?.completionTokens || 0,
        totalTokens: result.tokens?.totalTokens || 0,
        inputCost: (result.tokens?.promptTokens || 0) / 1000 * 0.008,
        outputCost: (result.tokens?.completionTokens || 0) / 1000 * 0.008,
        totalCost: ((result.tokens?.promptTokens || 0) / 1000 * 0.008) +
                  ((result.tokens?.completionTokens || 0) / 1000 * 0.008),
        requestType: 'image_analysis' as RequestType,
      });
    }

    return result;
  }

  async estimateCost(input: string, modelId: string = 'qwen-turbo') {
    return this.adapter.estimateCost({
      model: modelId,
      prompt: input,
    });
  }
}
