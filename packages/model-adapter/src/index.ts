import { DashScopeClient } from './dashscope/client.js';
import { TextModelAdapter } from './text/index.js';
import { MultimodalModelAdapter } from './multimodal/index.js';
import { RetryStrategy, DEFAULT_RETRY_CONFIG } from './retry/index.js';
import { estimateCost } from './token-counter/index.js';
import type {
  IModelAdapter,
  TextGenerationRequest,
  TextGenerationResponse,
  ChatRequest,
  ChatResponse,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  StreamChunk,
  CostEstimate,
  Model,
  ModelType,
  ModelCapability,
} from '@ai-gateway/core';

export class DashScopeModelAdapter implements IModelAdapter {
  private textAdapter: TextModelAdapter;
  private multimodalAdapter: MultimodalModelAdapter;
  private retryStrategy: RetryStrategy;

  constructor(
    apiKey: string,
    config?: {
      endpoint?: string;
      region?: string;
      retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;
    },
  ) {
    const client = new DashScopeClient({
      apiKey,
      endpoint: config?.endpoint,
      region: config?.region,
    });

    this.textAdapter = new TextModelAdapter(client);
    this.multimodalAdapter = new MultimodalModelAdapter(client);
    this.retryStrategy = new RetryStrategy(
      { ...DEFAULT_RETRY_CONFIG, ...config?.retryConfig },
    );
  }

  async textGeneration(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return this.retryStrategy.execute(
      `text:${request.model}`,
      () => this.textAdapter.textGeneration(request),
    );
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.retryStrategy.execute(
      `chat:${request.model}`,
      () => this.textAdapter.chat(request),
    );
  }

  async *chatStream(request: ChatRequest): AsyncIterable<StreamChunk> {
    const stream = this.textAdapter.chatStream(request);
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async imageAnalysis(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    return this.retryStrategy.execute(
      `image:${request.model}`,
      () => this.multimodalAdapter.imageAnalysis(request),
    );
  }

  async estimateCost(
    request: TextGenerationRequest | ChatRequest,
  ): Promise<CostEstimate> {
    let inputText = '';

    if ('prompt' in request) {
      inputText = request.prompt;
    } else {
      inputText = request.messages.map((m) => m.content).join('\n');
    }

    // 使用默认定价（实际应从 Model 表获取）
    const pricing = {
      inputPricePer1kTokens: 0.0008,
      outputPricePer1kTokens: 0.0008,
    };

    return estimateCost(inputText, 0.5, pricing);
  }

  async getModel(modelId: string): Promise<Model | null> {
    // 从数据库获取模型信息
    // 这里返回 null，实际实现应查询数据库
    return null;
  }

  async listModels(
    type?: ModelType,
    capability?: ModelCapability,
  ): Promise<Model[]> {
    // 从数据库获取模型列表
    // 这里返回空数组，实际实现应查询数据库
    return [];
  }
}

export * from './dashscope/client';
export * from './text/index';
export * from './multimodal/index';
export * from './retry/index';
export * from './token-counter/index';
export { DashScopeModelAdapter };
