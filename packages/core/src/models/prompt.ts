export interface Prompt {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  variables: PromptVariable[];
  version: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  tags: string[];
}

export enum PromptCategory {
  CHAT = 'chat',
  COMPLETION = 'completion',
  SYSTEM_INSTRUCTION = 'system_instruction',
  CODE_GENERATION = 'code_generation',
  DATA_EXTRACTION = 'data_extraction',
}

export interface PromptVariable {
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: unknown;
  description: string;
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  template: string;
  variables: PromptVariable[];
  isActive: boolean;
  createdAt: number;
  createdBy?: string;
  changeNote?: string;
}

export interface PromptUsage {
  promptId: string;
  version: number;
  usageCount: number;
  totalTokens: number;
  totalCost: number;
  lastUsedAt: number;
  avgLatencyMs: number;
}

// Prompt 渲染结果
export interface RenderedPrompt {
  template: string;
  variables: Record<string, unknown>;
  renderedText: string;
  version: number;
}
