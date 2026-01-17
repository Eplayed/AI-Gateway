import type { PrismaClient } from '@prisma/client';
import type {
  Agent,
  AgentFilters,
  AgentInvocationResult,
} from '@ai-gateway/core';

export class AgentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const created = await this.prisma.agent.create({
      data: {
        name: agent.name,
        description: agent.description,
        status: agent.status,
        capabilities: agent.capabilities as any,
        config: agent.config as any,
        metadata: agent.metadata as any,
      },
    });

    return this.toDomainAgent(created);
  }

  async findById(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) return null;
    return this.toDomainAgent(agent);
  }

  async list(filters?: AgentFilters): Promise<Agent[]> {
    const agents = await this.prisma.agent.findMany({
      where: {
        status: filters?.status,
      },
      orderBy: { createdAt: 'desc' },
    });

    return agents.map((a) => this.toDomainAgent(a));
  }

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const updated = await this.prisma.agent.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        capabilities: updates.capabilities as any,
        config: updates.config as any,
        metadata: updates.metadata as any,
      },
    });

    return this.toDomainAgent(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.agent.delete({ where: { id } });
  }

  async createInvocation(
    data: Omit<AgentInvocationResult, 'id'> & { apiKeyId?: string },
  ): Promise<AgentInvocationResult> {
    const invocation = await this.prisma.agentInvocation.create({
      data: {
        agentId: data.agentId,
        apiKeyId: data.apiKeyId,
        input: data.input as any,
        output: data.output as any,
        success: data.success,
        error: data.error?.message,
        tokensUsed: data.tokensUsed,
        latencyMs: data.latencyMs,
      },
    });

    return {
      success: invocation.success,
      output: invocation.output as any,
      error: invocation.error ? new Error(invocation.error) : undefined,
      tokensUsed: invocation.tokensUsed ?? undefined,
      latencyMs: invocation.latencyMs,
      agentId: invocation.agentId,
    };
  }

  async getInvocations(agentId: string, limit = 10) {
    const invocations = await this.prisma.agentInvocation.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return invocations.map((inv) => ({
      success: inv.success,
      output: inv.output as any,
      error: inv.error ? new Error(inv.error) : undefined,
      tokensUsed: inv.tokensUsed ?? undefined,
      latencyMs: inv.latencyMs,
      agentId: inv.agentId,
      createdAt: inv.createdAt.getTime(),
    }));
  }

  private toDomainAgent(agent: any): Agent {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status as any,
      capabilities: agent.capabilities,
      config: agent.config,
      metadata: agent.metadata,
      createdAt: agent.createdAt.getTime(),
      updatedAt: agent.updatedAt.getTime(),
    };
  }
}
