import type { WorkflowNode, WorkflowExecutionContext } from '@ai-gateway/core';
import type { WorkflowNodeExecutor } from './workflow-engine.js';
import type { AgentExecutor } from './agent-executor.js';
import { getLogger } from '@ai-gateway/logger';

const logger = getLogger();

export class AgentWorkflowNodeExecutor implements WorkflowNodeExecutor {
  constructor(private agentExecutor: AgentExecutor) {}

  async execute(
    node: WorkflowNode,
    input: unknown,
    context: WorkflowExecutionContext,
  ): Promise<{ output: unknown }> {
    if (node.type !== 'agent') {
      // 如果不是 agent 类型，直接透传 input
      // TODO: 后续支持 prompt/condition/merge 等类型
      return { output: input };
    }

    const agentId = node.agentId;
    if (!agentId) {
      throw new Error(`Node ${node.id} is of type 'agent' but missing agentId`);
    }

    logger.info(
      {
        workflowId: context.workflowId,
        executionId: context.executionId,
        nodeId: node.id,
        agentId,
      },
      'Executing agent node',
    );

    // 构造 Agent 的输入
    // 这里简单地将上一个节点的输出或 workflow input 透传给 Agent
    // 实际场景可能需要更复杂的参数映射逻辑 (Mapping)
    const agentInput = input;

    // 构造上下文
    const agentContext = {
      workflowId: context.workflowId,
      executionId: context.executionId,
      nodeId: node.id,
      ...node.config,
    };

    const result = await this.agentExecutor.invokeAgent(
      agentId,
      agentInput,
      agentContext,
    );

    if (!result.success) {
      throw result.error || new Error(`Agent invocation failed for ${agentId}`);
    }

    return { output: result.output };
  }
}
