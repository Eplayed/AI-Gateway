import { DashScopeModelAdapter } from '@ai-gateway/model-adapter';
import type { Agent, AgentInvocationResult } from '@ai-gateway/core';
import { getLogger } from '@ai-gateway/logger';
import type { AgentRegistry } from './agent-registry.js';

const logger = getLogger();

export class AgentExecutor {
  private modelAdapter: DashScopeModelAdapter;

  constructor(
    private agentRegistry: AgentRegistry,
  ) {
    const apiKey = process.env.DASHSCOPE_API_KEY || '';
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY is not set');
    }

    this.modelAdapter = new DashScopeModelAdapter(apiKey);
  }

  async invokeAgent(
    agentId: string,
    input: unknown,
    context?: Record<string, unknown>,
  ): Promise<AgentInvocationResult> {
    const startTime = Date.now();

    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        output: null,
        error: new Error(`Agent not found: ${agentId}`),
        latencyMs: Date.now() - startTime,
        agentId,
      };
    }

    if (agent.status !== 'idle') {
      return {
        success: false,
        output: null,
        error: new Error(`Agent is not available: status=${agent.status}`),
        latencyMs: Date.now() - startTime,
        agentId,
      };
    }

    // 更新状态为 busy
    await this.updateAgentStatus(agentId, 'busy');

    try {
      // 执行 Agent 逻辑
      const result = await this.executeAgentLogic(agent, input, context);

      const latencyMs = Date.now() - startTime;

      logger.info({
        agentId,
        success: result.success,
        latencyMs,
      }, 'Agent invocation completed');

      return {
        success: true,
        output: result.output,
        tokensUsed: result.tokensUsed,
        latencyMs,
        agentId,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      logger.error({
        agentId,
        error: error.message,
        latencyMs,
      }, 'Agent invocation failed');

      return {
        success: false,
        output: null,
        error,
        latencyMs,
        agentId,
      };
    } finally {
      // 恢复状态为 idle
      await this.updateAgentStatus(agentId, 'idle');
    }
  }

  private async executeAgentLogic(
    agent: Agent,
    input: unknown,
    context?: Record<string, unknown>,
  ): Promise<{ output: unknown; tokensUsed?: number }> {
    // 简单实现：调用对话接口
    // 实际可以根据 Agent 的 capabilities 选择不同的调用方式

    const prompt = this.buildPromptFromInput(input, context);

    const result = await this.modelAdapter.chat({
      model: agent.config.modelPreferences[0]?.modelId || 'qwen-turbo',
      messages: [
        { role: 'system', content: `You are ${agent.name}. ${agent.description}` },
        { role: 'user', content: prompt },
      ],
    });

    return {
      output: result.message.content,
      tokensUsed: result.tokens.totalTokens,
    };
  }

  private buildPromptFromInput(input: unknown, context?: Record<string, unknown>): string {
    if (typeof input === 'string') {
      return input;
    }

    if (typeof input === 'object' && input !== null) {
      return JSON.stringify(input);
    }

    return String(input);
  }

  private async updateAgentStatus(agentId: string, status: string): Promise<void> {
    // TODO: 更新数据库中的 Agent 状态
    // 这里简化处理，不实际更新数据库
    const agent = this.agentRegistry.getAgent(agentId);
    if (agent) {
      agent.status = status as any;
    }
  }
}

export { AgentExecutor };
