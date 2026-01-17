import type { PrismaClient } from '@prisma/client';
import type {
  Prompt,
  PromptVersion,
  PromptFilters,
} from '@ai-gateway/core';

export class PromptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    data: Omit<Prompt, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
  ): Promise<Prompt> {
    const prompt = await this.prisma.prompt.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        template: data.template,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
        tags: data.tags,
        versions: {
          create: {
            version: 1,
            template: data.template,
            isActive: true,
            createdBy: data.createdBy,
          },
        },
      },
    });

    return this.toDomainPrompt(prompt);
  }

  async findById(id: string, version?: number): Promise<Prompt | null> {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
      include: { versions: version ? undefined : undefined },
    });

    if (!prompt) return null;
    return this.toDomainPrompt(prompt);
  }

  async list(filters: PromptFilters): Promise<Prompt[]> {
    const prompts = await this.prisma.prompt.findMany({
      where: {
        category: filters.category,
        isActive: filters.isActive,
        tags: filters.tags ? { hasEvery: filters.tags } : undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { updatedAt: 'desc' },
      skip: filters.offset,
      take: filters.limit,
    });

    return prompts.map((p) => this.toDomainPrompt(p));
  }

  async update(
    id: string,
    updates: Partial<Prompt>,
    createNewVersion: boolean,
  ): Promise<Prompt> {
    if (createNewVersion) {
      const current = await this.prisma.prompt.findUnique({ where: { id } });
      if (!current) throw new Error('Prompt not found');

      const latestVersion = await this.prisma.promptVersion.findFirst({
        where: { promptId: id },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestVersion?.version ?? 0) + 1;

      // 创建新版本
      await this.prisma.promptVersion.create({
        data: {
          promptId: id,
          version: newVersion,
          template: updates.template ?? current.template,
          isActive: true,
          createdBy: updates.createdBy,
        },
      });

      // 将旧版本设为非活跃
      await this.prisma.promptVersion.updateMany({
        where: { promptId: id, version: { lt: newVersion } },
        data: { isActive: false },
      });
    }

    const prompt = await this.prisma.prompt.update({
      where: { id },
      data: updates,
    });

    return this.toDomainPrompt(prompt);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.prompt.delete({ where: { id } });
  }

  async getVersions(id: string): Promise<PromptVersion[]> {
    const versions = await this.prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { version: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      promptId: v.promptId,
      version: v.version,
      template: v.template,
      variables: [], // TODO: 从 template 解析变量
      isActive: v.isActive,
      createdAt: v.createdAt.getTime(),
      createdBy: v.createdBy,
      changeNote: v.changeNote,
    }));
  }

  async rollback(id: string, targetVersion: number): Promise<Prompt> {
    const targetVersionData = await this.prisma.promptVersion.findUnique({
      where: {
        promptId_version: { promptId: id, version: targetVersion },
      },
    });

    if (!targetVersionData) throw new Error('Target version not found');

    const current = await this.prisma.prompt.findUnique({ where: { id } });
    if (!current) throw new Error('Prompt not found');

    // 创建新版本，使用旧版本的模板
    const latestVersion = await this.prisma.promptVersion.findFirst({
      where: { promptId: id },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version ?? 0) + 1;

    await this.prisma.promptVersion.create({
      data: {
        promptId: id,
        version: newVersion,
        template: targetVersionData.template,
        isActive: true,
        createdBy: current.createdBy,
        changeNote: `Rollback from version ${targetVersion}`,
      },
    });

    // 更新主模板
    await this.prisma.prompt.update({
      where: { id },
      data: { template: targetVersionData.template },
    });

    return this.findById(id)!;
  }

  private toDomainPrompt(prompt: any): Prompt {
    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category as any,
      template: prompt.template,
      variables: [], // TODO: 从 template 解析变量
      version: prompt.versions.length,
      isActive: prompt.isActive,
      createdAt: prompt.createdAt.getTime(),
      updatedAt: prompt.updatedAt.getTime(),
      createdBy: prompt.createdBy,
      tags: prompt.tags,
    };
  }
}
