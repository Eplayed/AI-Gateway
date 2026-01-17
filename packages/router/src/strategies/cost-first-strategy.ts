import type {
  Model,
  RoutingRequest,
  RoutingContext,
  ModelRouteResult,
  RoutingStrategy,
} from '@ai-gateway/core';

export interface ModelPricingInfo {
  modelId: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  estimatedLatencyMs: number;
}

export class CostFirstRoutingStrategy {
  constructor(private models: Model[]) {}

  route(request: RoutingRequest, context: RoutingContext): ModelRouteResult {
    // 筛选支持该请求类型的模型
    let requestType: string;
    if ('messages' in request.input) {
      requestType = 'chat';
    } else if ('prompt' in request.input) {
      requestType = 'completion';
    } else {
      requestType = request.type;
    }

    const availableModels = this.models.filter((m) =>
      m.capabilities.includes('chat_completion' as any) ||
      m.capabilities.includes('text_generation' as any),
    );

    if (availableModels.length === 0) {
      throw new Error('No available models for this request');
    }

    // 计算每个模型的预估成本
    const modelScores = availableModels.map((model) => {
      const pricing = model.pricing;
      const latency = this.getEstimatedLatency(model);

      // 计算成本分数（越低越好）
      const avgCostPer1k = (pricing.inputPricePer1kTokens + pricing.outputPricePer1kTokens) / 2;

      return {
        model,
        costScore: avgCostPer1k,
        latency,
      };
    });

    // 按成本排序，选择成本最低的
    modelScores.sort((a, b) => a.costScore - b.costScore);

    const selected = modelScores[0];

    return {
      model: selected.model,
      strategy: RoutingStrategy.COST_FIRST,
      reason: `Selected ${selected.model.name} with lowest cost (${selected.costScore} CNY/1k tokens)`,
      estimatedCost: selected.costScore * 0.1, // 假设 100 tokens
      estimatedLatency: selected.latency,
    };
  }

  private getEstimatedLatency(model: Model): number {
    // 基于模型能力的延迟预估
    if (model.name.includes('turbo')) return 500;
    if (model.name.includes('plus')) return 1000;
    if (model.name.includes('max')) return 1500;
    return 1000;
  }
}
