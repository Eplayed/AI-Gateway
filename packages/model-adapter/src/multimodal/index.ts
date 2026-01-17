import { DashScopeClient } from '../dashscope/client.js';
import { countTokensSync, calculateCost } from '../token-counter/index.js';
import type {
  ImageAnalysisRequest,
  ImageAnalysisResponse,
} from '@ai-gateway/core';

export class MultimodalModelAdapter {
  constructor(
    private client: DashScopeClient,
    private defaultConfig: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    } = {},
  ) {}

  async imageAnalysis(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const startTime = Date.now();

    // 计算 Token（简化，仅计算文本 prompt）
    const promptTokens = countTokensSync(request.prompt);

    // 调用 DashScope 多模态接口
    const response = await this.client.callImageAnalysis(
      request.model,
      request.image,
      request.prompt,
      {
        temperature: request.config?.temperature ?? this.defaultConfig.temperature,
        topP: request.config?.topP ?? this.defaultConfig.topP,
        maxTokens: request.config?.maxTokens ?? this.defaultConfig.maxTokens,
      },
    );

    const content = response?.output?.choices?.[0]?.message?.content?.[0]?.text || '';
    const completionTokens = countTokensSync(content);
    const totalTokens = promptTokens + completionTokens;

    // 计算成本（多模态定价可能不同）
    const pricing = {
      inputPricePer1kTokens: 0.008,
      outputPricePer1kTokens: 0.008,
    };
    const { inputCost, outputCost, totalCost } = calculateCost(promptTokens, completionTokens, pricing);

    return {
      content,
      model: request.model,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      latencyMs: Date.now() - startTime,
    };
  }
}
