import type { PrismaClient } from '@prisma/client';
import type {
  ExecutionStatus,
  ExecutionError,
} from '@ai-gateway/core';

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  input: unknown;
  finalOutput?: unknown;
  nodeResults?: Record<string, unknown>;
  errors?: ExecutionError[];
  startTime: number;
  endTime?: number;
}

export class WorkflowExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    workflowId: string,
    input: unknown,
    status: ExecutionStatus,
  ): Promise<WorkflowExecutionRecord> {
    const created = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        status,
        input: input as any,
      },
    });

    return this.toDomainRecord(created);
  }

  async update(
    id: string,
    updates: Partial<{
      status: ExecutionStatus;
      finalOutput: unknown;
      nodeResults: Record<string, unknown>;
      errors: ExecutionError[];
      endTime: number;
    }>,
  ): Promise<WorkflowExecutionRecord> {
    const updated = await this.prisma.workflowExecution.update({
      where: { id },
      data: {
        status: updates.status,
        finalOutput: updates.finalOutput as any,
        nodeResults: updates.nodeResults as any,
        errors: updates.errors as any,
        endTime: updates.endTime ? new Date(updates.endTime) : undefined,
      },
    });

    return this.toDomainRecord(updated);
  }

  async listByWorkflowId(
    workflowId: string,
  ): Promise<WorkflowExecutionRecord[]> {
    const executions = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startTime: 'desc' },
    });

    return executions.map((execution) => this.toDomainRecord(execution));
  }

  async findById(id: string): Promise<WorkflowExecutionRecord | null> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      return null;
    }

    return this.toDomainRecord(execution);
  }

  private toDomainRecord(execution: any): WorkflowExecutionRecord {
    return {
      id: execution.id,
      workflowId: execution.workflowId,
      status: execution.status as ExecutionStatus,
      input: execution.input as unknown,
      finalOutput: execution.finalOutput as unknown,
      nodeResults: execution.nodeResults as Record<string, unknown> | null || undefined,
      errors: execution.errors as ExecutionError[] | null || undefined,
      startTime: execution.startTime.getTime(),
      endTime: execution.endTime ? execution.endTime.getTime() : undefined,
    };
  }
}
