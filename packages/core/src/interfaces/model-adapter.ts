import type {
  Model,
  ModelType,
  ModelCapability,
  ModelConfig,
  CostEstimate,
} from '../models/model';

// 文本生成请求
export interface TextGenerationRequest {
  model: string;
  prompt: string;
  config?: Partial<ModelConfig>;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TextGenerationResponse {
  content: string;
  model: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

// 对话请求
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  config?: Partial<ModelConfig>;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: ChatMessage;
  model: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

// 图片理解请求
export interface ImageAnalysisRequest {
  model: string;
  image: ImageInput;
  prompt: string;
  config?: Partial<ModelConfig>;
  metadata?: Record<string, unknown>;
}

export interface ImageInput {
  type: 'url' | 'base64' | 'binary';
  data: string | Buffer;
  mimeType?: string;
}

export interface ImageAnalysisResponse {
  content: string;
  model: string;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

// 流式输出接口
export interface StreamChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  error?: Error;
  done?: boolean;
}

// 模型适配器统一接口
export interface IModelAdapter {
  textGeneration(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncIterable<StreamChunk>;
  imageAnalysis(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse>;
  estimateCost(request: TextGenerationRequest | ChatRequest): Promise<CostEstimate>;
  getModel(modelId: string): Promise<Model | null>;
  listModels(type?: ModelType, capability?: ModelCapability): Promise<Model[]>;
}

// 重试策略配置
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}
