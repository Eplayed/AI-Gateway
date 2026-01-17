import { AgentRegistry, AgentExecutor } from '../services/index.js';
import { AgentRepository } from '@ai-gateway/infrastructure';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { Context } from 'hono';

const prisma = new PrismaClient();
const agentRepository = new AgentRepository(prisma);
const agentRegistry = new AgentRegistry(agentRepository);
const agentExecutor = new AgentExecutor(agentRegistry);

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['idle', 'busy', 'offline', 'error']).default('idle'),
  capabilities: z.array(z.object({
    type: z.string(),
    models: z.array(z.string()),
    priority: z.number(),
  })).default([]),
  config: z.object({
    maxConcurrentTasks: z.number().default(1),
    timeoutMs: z.number().default(60000),
    retryPolicy: z.object({
      maxRetries: z.number().default(3),
      backoffMs: z.number().default(1000),
      backoffMultiplier: z.number().default(2),
    }).default({}),
    modelPreferences: z.array(z.object({
      modelId: z.string(),
      priority: z.number(),
      costTier: z.string(),
    })).default([]),
  }).default({}),
  metadata: z.record(z.unknown()).optional(),
});

const invokeAgentSchema = z.object({
  input: z.unknown(),
  context: z.record(z.unknown()).optional(),
});

export class AgentController {
  async createAgent(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createAgentSchema.parse(body);

      const agent = await agentRegistry.registerAgent({
        id: crypto.randomUUID(),
        ...validated,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return c.json({ success: true, data: agent }, 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getAgent(c: Context) {
    try {
      const id = c.req.param('agentId');
      const agent = agentRegistry.getAgent(id);

      if (!agent) {
        return c.json({ success: false, error: 'Agent not found' }, 404);
      }

      return c.json({ success: true, data: agent });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async listAgents(c: Context) {
    try {
      const status = c.req.query('status');
      const agents = await agentRegistry.listAgents(status ? { status } : undefined);

      return c.json({ success: true, data: agents });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async invokeAgent(c: Context) {
    try {
      const id = c.req.param('agentId');
      const body = await c.req.json();
      const validated = invokeAgentSchema.parse(body);

      const result = await agentExecutor.invokeAgent(
        id,
        validated.input,
        validated.context,
      );

      return c.json({ success: true, data: result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async deleteAgent(c: Context) {
    try {
      const id = c.req.param('agentId');
      await agentRegistry.unregisterAgent(id);

      return c.json({ success: true, message: 'Agent deleted successfully' });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getRegistryStats(c: Context) {
    try {
      const count = agentRegistry.getRegisteredAgentsCount();

      return c.json({
        success: true,
        data: {
          totalAgents: count,
          status: 'ok',
        },
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
