export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  rateLimit?: RateLimit;
  config: ModelConfig;
}

export enum ModelProvider {
  DASHSCOPE = 'dashscope',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export enum ModelType {
  TEXT = 'text',
  MULTIMODAL = 'multimodal',
  IMAGE = 'image',
  AUDIO = 'audio',
}

export enum ModelCapability {
  TEXT_GENERATION = 'text_generation',
  CHAT_COMPLETION = 'chat_completion',
  IMAGE_ANALYSIS = 'image_analysis',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
  FUNCTION_CALLING = 'function_calling',
  STREAMING = 'streaming',
}

export interface ModelPricing {
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  currency: string;
}

export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

export interface ModelConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  supportedParameters: string[];
}

// 模型路由规则
export interface ModelRoute {
  id: string;
  name: string;
  strategy: RoutingStrategy;
  rules: RoutingRule[];
  defaultModelId: string;
  fallbackModelId?: string;
  isActive: boolean;
}

export enum RoutingStrategy {
  COST_FIRST = 'cost_first',
  LATENCY_FIRST = 'latency_first',
  QUALITY_FIRST = 'quality_first',
  HYBRID = 'hybrid',
}

export interface RoutingRule {
  condition: string;
  modelId: string;
  priority: number;
  weight?: number;
}
