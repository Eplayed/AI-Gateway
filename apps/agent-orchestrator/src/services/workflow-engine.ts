import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecutionContext,
  ExecutionStatus,
  ExecutionError,
} from '@ai-gateway/core';
import { getLogger } from '@ai-gateway/logger';

const logger = getLogger();

export interface WorkflowStore {
  findById(id: string): Promise<Workflow | null>;
}

export interface WorkflowExecutionStore {
  create(
    workflowId: string,
    input: unknown,
    status: ExecutionStatus,
  ): Promise<{
    id: string;
  }>;

  update(
    id: string,
    updates: Partial<{
      status: ExecutionStatus;
      finalOutput: unknown;
      nodeResults: Record<string, unknown>;
      errors: ExecutionError[];
      endTime: number;
    }>,
  ): Promise<void>;
}

export interface WorkflowNodeExecutor {
  execute(
    node: WorkflowNode,
    input: unknown,
    context: WorkflowExecutionContext,
  ): Promise<{ output: unknown }>;
}

export class WorkflowEngine {
  constructor(
    private workflowStore: WorkflowStore,
    private executionStore: WorkflowExecutionStore,
    private nodeExecutor: WorkflowNodeExecutor,
  ) {}

  async startExecution(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowExecutionContext> {
    const workflow = await this.workflowStore.findById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution = await this.executionStore.create(
      workflowId,
      input,
      ExecutionStatus.RUNNING,
    );

    const context: WorkflowExecutionContext = {
      workflowId,
      executionId: execution.id,
      status: ExecutionStatus.RUNNING,
      currentNodeId: undefined,
      results: new Map<string, unknown>(),
      errors: [],
      startTime: Date.now(),
      endTime: undefined,
    };

    try {
      const { finalOutput, nodeResults } = await this.runWorkflow(
        workflow,
        input,
        context,
      );

      context.status = context.errors.length === 0
        ? ExecutionStatus.COMPLETED
        : ExecutionStatus.FAILED;
      context.endTime = Date.now();

      await this.executionStore.update(execution.id, {
        status: context.status,
        finalOutput,
        nodeResults,
        errors: context.errors,
        endTime: context.endTime,
      });
    } catch (error: any) {
      context.status = ExecutionStatus.FAILED;
      context.endTime = Date.now();
      context.errors.push({
        nodeId: context.currentNodeId || '',
        error,
        timestamp: Date.now(),
      });

      await this.executionStore.update(execution.id, {
        status: context.status,
        errors: context.errors,
        endTime: context.endTime,
      });

      logger.error(
        {
          workflowId,
          executionId: execution.id,
          error: error.message,
        },
        'Workflow execution failed',
      );
    }

    return context;
  }

  private async runWorkflow(
    workflow: Workflow,
    input: unknown,
    context: WorkflowExecutionContext,
  ): Promise<{
    finalOutput: unknown;
    nodeResults: Record<string, unknown>;
  }> {
    const nodesById = new Map<string, WorkflowNode>();
    workflow.nodes.forEach((node) => {
      nodesById.set(node.id, node);
    });

    const outgoingEdges = new Map<string, WorkflowEdge[]>();
    const incomingCount = new Map<string, number>();

    workflow.nodes.forEach((node) => {
      outgoingEdges.set(node.id, []);
      incomingCount.set(node.id, 0);
    });

    workflow.edges.forEach((edge) => {
      const list = outgoingEdges.get(edge.source);
      if (list) {
        list.push(edge);
      }
      const count = incomingCount.get(edge.target) || 0;
      incomingCount.set(edge.target, count + 1);
    });

    const readyQueue: string[] = [];
    incomingCount.forEach((count, nodeId) => {
      if (count === 0) {
        readyQueue.push(nodeId);
      }
    });

    if (readyQueue.length === 0 && workflow.nodes.length > 0) {
      throw new Error('Workflow has no entry nodes');
    }

    const nodeResults = new Map<string, unknown>();
    const processed = new Set<string>();

    while (readyQueue.length > 0) {
      const currentBatch = [...readyQueue];
      readyQueue.length = 0;

      const executions = currentBatch.map(async (nodeId) => {
        const node = nodesById.get(nodeId);
        if (!node) {
          throw new Error(`Node not found: ${nodeId}`);
        }

        context.currentNodeId = nodeId;

        try {
          const result = await this.nodeExecutor.execute(
            node,
            input,
            context,
          );
          nodeResults.set(nodeId, result.output);
          context.results.set(nodeId, result.output);
          processed.add(nodeId);
        } catch (error: any) {
          const executionError: ExecutionError = {
            nodeId,
            error,
            timestamp: Date.now(),
          };
          context.errors.push(executionError);
          logger.error(
            {
              workflowId: workflow.id,
              executionId: context.executionId,
              nodeId,
              error: error.message,
            },
            'Workflow node execution failed',
          );
        }
      });

      await Promise.all(executions);

      currentBatch.forEach((nodeId) => {
        const edges = outgoingEdges.get(nodeId) || [];
        edges.forEach((edge) => {
          const targetId = edge.target;
          const count = incomingCount.get(targetId);
          if (count === undefined) {
            return;
          }
          const nextCount = count - 1;
          incomingCount.set(targetId, nextCount);
          if (nextCount === 0) {
            readyQueue.push(targetId);
          }
        });
      });
    }

    if (processed.size !== workflow.nodes.length) {
      const error = new Error('Workflow execution did not process all nodes');
      context.errors.push({
        nodeId: '',
        error,
        timestamp: Date.now(),
      });
      logger.error(
        {
          workflowId: workflow.id,
          executionId: context.executionId,
        },
        'Workflow execution incomplete',
      );
    }

    const sinkNodes = workflow.nodes.filter((node) => {
      const edges = outgoingEdges.get(node.id) || [];
      return edges.length === 0;
    });

    let finalOutput: unknown = undefined;
    if (sinkNodes.length === 1) {
      finalOutput = nodeResults.get(sinkNodes[0].id);
    } else if (sinkNodes.length > 1) {
      const outputs: Record<string, unknown> = {};
      sinkNodes.forEach((node) => {
        outputs[node.id] = nodeResults.get(node.id);
      });
      finalOutput = outputs;
    }

    const nodeResultsObject: Record<string, unknown> = {};
    nodeResults.forEach((value, key) => {
      nodeResultsObject[key] = value;
    });

    return {
      finalOutput,
      nodeResults: nodeResultsObject,
    };
  }
}

