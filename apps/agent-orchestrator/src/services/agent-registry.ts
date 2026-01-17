import { AgentRepository } from '@ai-gateway/infrastructure';
import { PrismaClient } from '@prisma/client';
import type { Agent, AgentFilters, AgentInvocationResult } from '@ai-gateway/core';
import { getLogger } from '@ai-gateway/logger';

const logger = getLogger();

export class AgentRegistry {
  private agents = new Map<string, Agent>();

  constructor(
    private agentRepository: AgentRepository,
  ) {}

  async registerAgent(agent: Agent): Promise<void> {
    // 检查是否已存在
    if (this.agents.has(agent.id)) {
      logger.warn({ agentId: agent.id }, 'Agent already registered, updating');
    }

    // 保存到数据库
    const existing = await this.agentRepository.findById(agent.id);
    if (existing) {
      await this.agentRepository.update(agent.id, agent);
    } else {
      await this.agentRepository.create(agent);
    }

    // 更新内存缓存
    this.agents.set(agent.id, agent);
    logger.info({ agentId: agent.id, name: agent.name }, 'Agent registered');
  }

  async unregisterAgent(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      logger.warn({ agentId }, 'Agent not found in registry');
      return;
    }

    await this.agentRepository.delete(agentId);
    this.agents.delete(agentId);
    logger.info({ agentId }, 'Agent unregistered');
  }

  getAgent(agentId: string): Agent | null {
    return this.agents.get(agentId) || null;
  }

  async listAgents(filters?: AgentFilters): Promise<Agent[]> {
    if (!filters) {
      return Array.from(this.agents.values());
    }

    // 如果有过滤条件，从数据库查询
    return this.agentRepository.list(filters);
  }

  async refreshRegistry(): Promise<void> {
    logger.info('Refreshing agent registry from database');
    const agents = await this.agentRepository.list();
    this.agents.clear();
    agents.forEach((agent) => {
      this.agents.set(agent.id, agent);
    });
    logger.info({ count: agents.length }, 'Agent registry refreshed');
  }

  getRegisteredAgentsCount(): number {
    return this.agents.size;
  }

  isAgentRegistered(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}

export { AgentRegistry };
