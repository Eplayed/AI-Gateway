import type { Agent, Workflow, WorkflowExecutionContext } from '../models/agent';

export interface IAgentOrchestrator {
  registerAgent(agent: Agent): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<Agent | null>;
  listAgents(filters?: AgentFilters): Promise<Agent[]>;
  invokeAgent(
    agentId: string,
    input: unknown,
    context?: Record<string, unknown>,
  ): Promise<AgentInvocationResult>;
}

export interface AgentFilters {
  status?: string;
  capabilityType?: string;
  maxCostTier?: string;
}

export interface AgentInvocationResult {
  success: boolean;
  output: unknown;
  error?: Error;
  tokensUsed?: number;
  latencyMs: number;
  agentId: string;
}

export interface IWorkflowEngine {
  createWorkflow(workflow: Omit<Workflow, 'id' | 'status'>): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<void>;
  getWorkflow(id: string): Promise<Workflow | null>;
  executeWorkflow(workflowId: string, input: unknown): Promise<WorkflowExecutionResult>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: string;
  finalOutput?: unknown;
  errors: Error[];
  nodeResults: Map<string, unknown>;
  startTime: number;
  endTime: number;
}
