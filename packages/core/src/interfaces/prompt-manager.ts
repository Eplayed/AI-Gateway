import type {
  Prompt,
  PromptVersion,
  PromptUsage,
  RenderedPrompt,
} from '../models/prompt';

export interface IPromptManager {
  createPrompt(prompt: Omit<Prompt, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Prompt>;
  updatePrompt(
    id: string,
    updates: Partial<Prompt>,
    createNewVersion: boolean,
  ): Promise<Prompt>;
  deletePrompt(id: string): Promise<void>;
  getPrompt(id: string, version?: number): Promise<Prompt | null>;
  listPrompts(filters: PromptFilters): Promise<Prompt[]>;
  renderPrompt(
    id: string,
    variables: Record<string, unknown>,
    version?: number,
  ): Promise<RenderedPrompt>;
  getPromptVersions(id: string): Promise<PromptVersion[]>;
  rollbackPrompt(id: string, version: number): Promise<Prompt>;
  getPromptUsageStats(id: string): Promise<PromptUsage[]>;
  createABTest(test: ABTestConfig): Promise<ABTest>;
  updateABTest(id: string, updates: Partial<ABTestConfig>): Promise<ABTest>;
}

export interface PromptFilters {
  category?: string;
  isActive?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ABTestConfig {
  promptId: string;
  name: string;
  description: string;
  versions: number[]; // 版本号列表
  trafficAllocation: number[]; // 流量分配百分比
  startDate: number;
  endDate?: number;
  metrics: ABTestMetric[];
}

export interface ABTest {
  id: string;
  promptId: string;
  name: string;
  description: string;
  versions: number[];
  trafficAllocation: number[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: number;
  endDate?: number;
  metrics: ABTestMetric[];
  results?: ABTestResult[];
}

export interface ABTestMetric {
  name: string;
  type: 'conversion' | 'latency' | 'cost' | 'satisfaction';
  threshold: number;
}

export interface ABTestResult {
  version: number;
  sampleSize: number;
  metricValues: Record<string, number>;
  winning?: boolean;
}
