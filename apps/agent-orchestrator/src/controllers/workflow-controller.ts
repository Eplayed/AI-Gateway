import type { Context } from 'hono';
import { z } from 'zod';
import {
  WorkflowStatus,
  ExecutionStatus,
  type WorkflowConfig,
  type RetryPolicy,
} from '@ai-gateway/core';
import {
  WorkflowRepository,
  WorkflowExecutionRepository,
  createPrismaClient,
} from '@ai-gateway/infrastructure';
import {
  WorkflowEngine,
  type WorkflowStore,
  type WorkflowExecutionStore,
  type WorkflowNodeExecutor,
  AgentWorkflowNodeExecutor,
} from '../services/index.js';
import { AgentRegistry, AgentExecutor } from '../services/index.js';
import { AgentRepository } from '@ai-gateway/infrastructure';

const prisma = createPrismaClient();
const workflowRepository = new WorkflowRepository(prisma);
const workflowExecutionRepository = new WorkflowExecutionRepository(prisma);
const agentRepository = new AgentRepository(prisma);
const agentRegistry = new AgentRegistry(agentRepository);
const agentExecutor = new AgentExecutor(agentRegistry);

const workflowStore: WorkflowStore = {
  findById: (id: string) => workflowRepository.findById(id),
};

const workflowExecutionStore: WorkflowExecutionStore = {
  async create(workflowId: string, input: unknown, status: ExecutionStatus) {
    const execution = await workflowExecutionRepository.create(
      workflowId,
      input,
      status,
    );
    return { id: execution.id };
  },
  async update(
    id: string,
    updates: Partial<{
      status: ExecutionStatus;
      finalOutput: unknown;
      nodeResults: Record<string, unknown>;
      errors: any[];
      endTime: number;
    }>,
  ) {
    await workflowExecutionRepository.update(id, updates as any);
  },
};

const nodeExecutor = new AgentWorkflowNodeExecutor(agentExecutor);
const workflowEngine = new WorkflowEngine(
  workflowStore,
  workflowExecutionStore,
  nodeExecutor,
);

const retryPolicySchema = z.object({
  maxRetries: z.number().int().nonnegative().default(3),
  backoffMs: z.number().int().nonnegative().default(1000),
  backoffMultiplier: z.number().positive().default(2),
});

const workflowConfigSchema = z.object({
  maxExecutionTimeMs: z.number().int().positive().default(60000),
  retryPolicy: retryPolicySchema.default({
    maxRetries: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  }),
  saveResults: z.boolean().default(true),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  config: workflowConfigSchema.optional(),
  nodes: z.array(
    z.object({
      type: z.enum(['agent', 'prompt', 'condition', 'merge']),
      agentId: z.string().optional(),
      promptId: z.string().optional(),
      config: z.record(z.unknown()).optional(),
      position: z.object({
        x: z.number().int(),
        y: z.number().int(),
      }).optional(),
    }),
  ).min(1),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      condition: z.record(z.unknown()).optional(),
    }),
  ).optional().default([]),
});

const executeWorkflowSchema = z.object({
  input: z.unknown(),
});

export class WorkflowController {
  async createWorkflow(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createWorkflowSchema.parse(body);

      const config: WorkflowConfig = validated.config || {
        maxExecutionTimeMs: 60000,
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 1000,
          backoffMultiplier: 2,
        } as RetryPolicy,
        saveResults: true,
      };

      const workflow = await workflowRepository.create({
        name: validated.name,
        description: validated.description || '',
        status: validated.status as WorkflowStatus,
        config,
        nodes: validated.nodes.map((node) => ({
          type: node.type as any,
          agentId: node.agentId,
          promptId: node.promptId,
          config: node.config || {},
          position: node.position || { x: 0, y: 0 },
        })),
        edges: validated.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          condition: edge.condition as any,
        })),
      });

      return c.json({ success: true, data: workflow }, 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async executeWorkflow(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = executeWorkflowSchema.parse(body);

      const context = await workflowEngine.startExecution(
        id,
        validated.input,
      );

      const results: Record<string, unknown> = {};
      context.results.forEach((value, key) => {
        results[key] = value;
      });

      return c.json({
        success: true,
        data: {
          workflowId: context.workflowId,
          executionId: context.executionId,
          status: context.status,
          currentNodeId: context.currentNodeId,
          results,
          errors: context.errors.map((e) => ({
            nodeId: e.nodeId,
            message: e.error.message,
            timestamp: e.timestamp,
          })),
          startTime: context.startTime,
          endTime: context.endTime,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getExecution(c: Context) {
    try {
      const id = c.req.param('executionId');
      const execution = await workflowExecutionRepository.findById(id);

      if (!execution) {
        return c.json({ success: false, error: 'Execution not found' }, 404);
      }

      return c.json({ success: true, data: execution });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async listExecutions(c: Context) {
    try {
      const id = c.req.param('id');
      const executions = await workflowExecutionRepository.listByWorkflowId(id);

      return c.json({ success: true, data: executions });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}

