import { PromptRepository } from '@ai-gateway/infrastructure';
import Handlebars from 'handlebars';
import type {
  Prompt,
  PromptFilters,
  RenderedPrompt,
} from '@ai-gateway/core';

export class PromptService {
  constructor(private promptRepository: PromptRepository) {}

  async create(data: Omit<Prompt, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    return this.promptRepository.create(data);
  }

  async findById(id: string, version?: number): Promise<Prompt | null> {
    return this.promptRepository.findById(id, version);
  }

  async list(filters: PromptFilters): Promise<Prompt[]> {
    return this.promptRepository.list(filters);
  }

  async update(
    id: string,
    updates: Partial<Prompt>,
    createNewVersion: boolean,
  ): Promise<Prompt> {
    return this.promptRepository.update(id, updates, createNewVersion);
  }

  async delete(id: string): Promise<void> {
    await this.promptRepository.delete(id);
  }

  async getVersions(id: string) {
    return this.promptRepository.getVersions(id);
  }

  async rollback(id: string, targetVersion: number): Promise<Prompt> {
    return this.promptRepository.rollback(id, targetVersion);
  }

  async render(
    id: string,
    variables: Record<string, unknown>,
    version?: number,
  ): Promise<RenderedPrompt> {
    const prompt = await this.promptRepository.findById(id, version);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    // 使用 Handlebars 渲染
    const template = Handlebars.compile(prompt.template);
    const renderedText = template(variables);

    return {
      template: prompt.template,
      variables,
      renderedText,
      version: prompt.version,
    };
  }

  async getUsageStats(id: string) {
    // TODO: 实现 Prompt 使用统计
    return [];
  }
}
