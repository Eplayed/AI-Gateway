import type { PrismaClient } from '@prisma/client';
import type {
  Workflow as DomainWorkflow,
  WorkflowNode as DomainWorkflowNode,
  WorkflowEdge as DomainWorkflowEdge,
  WorkflowStatus,
  WorkflowConfig,
} from '@ai-gateway/core';

export class WorkflowRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<DomainWorkflow | null> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) {
      return null;
    }

    return this.toDomainWorkflow(workflow);
  }

  async create(
    data: Omit<DomainWorkflow, 'id' | 'nodes' | 'edges'> & {
      nodes: Omit<DomainWorkflowNode, 'id'>[];
      edges: Omit<DomainWorkflowEdge, 'id'>[];
    },
  ): Promise<DomainWorkflow> {
    const created = await this.prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        config: data.config as any,
        nodes: {
          create: data.nodes.map((node) => ({
            type: node.type,
            agentId: node.agentId,
            promptId: node.promptId,
            config: node.config as any,
            positionX: node.position.x,
            positionY: node.position.y,
          })),
        },
        edges: {
          create: data.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            condition: edge.condition as any,
          })),
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    return this.toDomainWorkflow(created);
  }

  private toDomainWorkflow(workflow: any): DomainWorkflow {
    const nodes: DomainWorkflowNode[] = workflow.nodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      agentId: node.agentId || undefined,
      promptId: node.promptId || undefined,
      config: node.config as Record<string, unknown>,
      position: {
        x: node.positionX,
        y: node.positionY,
      },
    }));

    const edges: DomainWorkflowEdge[] = workflow.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      condition: edge.condition as any,
    }));

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      nodes,
      edges,
      status: workflow.status as WorkflowStatus,
      config: workflow.config as WorkflowConfig,
    };
  }
}

