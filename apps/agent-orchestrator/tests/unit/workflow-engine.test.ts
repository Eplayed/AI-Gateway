import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WorkflowEngine,
  type WorkflowStore,
  type WorkflowExecutionStore,
  type WorkflowNodeExecutor,
} from '../../src/services/workflow-engine.js';
import {
  ExecutionStatus,
  type Workflow,
  type WorkflowExecutionContext,
} from '@ai-gateway/core';

describe('WorkflowEngine', () => {
  const workflowStore: WorkflowStore = {
    findById: vi.fn(),
  };

  const executionStore: WorkflowExecutionStore = {
    create: vi.fn(),
    update: vi.fn(),
  };

  const nodeExecutor: WorkflowNodeExecutor = {
    execute: vi.fn(),
  };

  const engine = new WorkflowEngine(workflowStore, executionStore, nodeExecutor);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should execute a simple sequential workflow', async () => {
    const workflow: Workflow = {
      id: 'wf-1',
      name: 'Sequential Workflow',
      description: '',
      status: 'active' as any,
      config: {
        maxExecutionTimeMs: 60000,
        retryPolicy: {
          maxRetries: 0,
          backoffMs: 0,
          backoffMultiplier: 1,
        },
        saveResults: true,
      },
      nodes: [
        {
          id: 'n1',
          type: 'agent' as any,
          config: {},
          position: { x: 0, y: 0 },
        },
        {
          id: 'n2',
          type: 'agent' as any,
          config: {},
          position: { x: 1, y: 0 },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
        },
      ],
    };

    (workflowStore.findById as any).mockResolvedValue(workflow);
    (executionStore.create as any).mockResolvedValue({ id: 'exec-1' });
    (executionStore.update as any).mockResolvedValue(undefined);

    const executionOrder: string[] = [];

    (nodeExecutor.execute as any).mockImplementation(
      async (node: any, input: unknown, context: WorkflowExecutionContext) => {
        executionOrder.push(node.id);
        return { output: `${node.id}-output` };
      },
    );

    const context = await engine.startExecution('wf-1', { foo: 'bar' });

    expect(context.status).toBe(ExecutionStatus.COMPLETED);
    expect(executionOrder).toEqual(['n1', 'n2']);
    expect(executionStore.create).toHaveBeenCalledWith(
      'wf-1',
      { foo: 'bar' },
      ExecutionStatus.RUNNING,
    );
    expect(executionStore.update).toHaveBeenCalled();
  });

  it('should execute parallel nodes before sink node', async () => {
    const workflow: Workflow = {
      id: 'wf-2',
      name: 'Parallel Workflow',
      description: '',
      status: 'active' as any,
      config: {
        maxExecutionTimeMs: 60000,
        retryPolicy: {
          maxRetries: 0,
          backoffMs: 0,
          backoffMultiplier: 1,
        },
        saveResults: true,
      },
      nodes: [
        {
          id: 'a',
          type: 'agent' as any,
          config: {},
          position: { x: 0, y: 0 },
        },
        {
          id: 'b',
          type: 'agent' as any,
          config: {},
          position: { x: 1, y: 0 },
        },
        {
          id: 'c',
          type: 'agent' as any,
          config: {},
          position: { x: 2, y: 0 },
        },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'c' },
        { id: 'e2', source: 'b', target: 'c' },
      ],
    };

    (workflowStore.findById as any).mockResolvedValue(workflow);
    (executionStore.create as any).mockResolvedValue({ id: 'exec-2' });
    (executionStore.update as any).mockResolvedValue(undefined);

    const executionOrder: string[] = [];

    (nodeExecutor.execute as any).mockImplementation(
      async (node: any, input: unknown, context: WorkflowExecutionContext) => {
        executionOrder.push(node.id);
        return { output: `${node.id}-output` };
      },
    );

    const context = await engine.startExecution('wf-2', {});

    expect(context.status).toBe(ExecutionStatus.COMPLETED);
    expect(executionOrder[executionOrder.length - 1]).toBe('c');
    expect(new Set(executionOrder.slice(0, 2))).toEqual(new Set(['a', 'b']));
  });
}

