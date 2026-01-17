export interface TokenUsage {
  id: string;
  apiKey: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  timestamp: number;
  requestType: RequestType;
  metadata?: Record<string, unknown>;
}

export enum RequestType {
  TEXT_GENERATION = 'text_generation',
  CHAT = 'chat',
  IMAGE_ANALYSIS = 'image_analysis',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
}

// 成本预估
export interface CostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  currency: string;
  confidence: number; // 0-1, 预估置信度
}

// 成本控制策略
export interface CostControlPolicy {
  apiKey: string;
  dailyBudget: number;
  currentDailyUsage: number;
  monthlyBudget: number;
  currentMonthlyUsage: number;
  alertThreshold: number; // percentage
  blockWhenExceeded: boolean;
}

export interface CostAlert {
  policyId: string;
  threshold: number;
  currentUsage: number;
  budget: number;
  alertType: AlertType;
  timestamp: number;
}

export enum AlertType {
  WARNING = 'warning',
  CRITICAL = 'critical',
  EXCEEDED = 'exceeded',
}
