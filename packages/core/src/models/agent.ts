// Agent 实体
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
  config: AgentConfig;
  metadata: Record<string, unknown>;
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export interface AgentCapability {
  type: CapabilityType;
  models: string[];
  priority: number;
}

export enum CapabilityType {
  TEXT_GENERATION = 'text_generation',
  IMAGE_ANALYSIS = 'image_analysis',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  modelPreferences: ModelPreference[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface ModelPreference {
  modelId: string;
  priority: number;
  costTier: CostTier;
}

export enum CostTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Workflow 实体
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowStatus;
  config: WorkflowConfig;
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  agentId?: string;
  promptId?: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export enum NodeType {
  AGENT = 'agent',
  PROMPT = 'prompt',
  CONDITION = 'condition',
  MERGE = 'merge',
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: EdgeCondition;
}

export interface EdgeCondition {
  expression: string;
  expectedValue: unknown;
}

export interface WorkflowConfig {
  maxExecutionTimeMs: number;
  retryPolicy: RetryPolicy;
  saveResults: boolean;
}

// Workflow 执行上下文
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  status: ExecutionStatus;
  currentNodeId?: string;
  results: Map<string, unknown>;
  errors: ExecutionError[];
  startTime: number;
  endTime?: number;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ExecutionError {
  nodeId: string;
  error: Error;
  timestamp: number;
}
