import { PromptService } from '../services/prompt-service.js';
import { z } from 'zod';
import type { Context } from 'hono';

const createPromptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['chat', 'completion', 'system_instruction', 'code_generation', 'data_extraction']),
  template: z.string().min(1),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  template: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const renderPromptSchema = z.object({
  variables: z.record(z.unknown()),
  version: z.number().optional(),
});

const rollbackSchema = z.object({
  version: z.number().positive(),
});

export class PromptController {
  constructor(private promptService: PromptService) {}

  async createPrompt(c: Context) {
    try {
      const body = await c.req.json();
      const validated = createPromptSchema.parse(body);

      const createNewVersion = validated.isActive ?? true;
      const prompt = await this.promptService.create({
        ...validated,
        isActive: createNewVersion,
      });

      return c.json({ success: true, data: prompt }, 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getPrompt(c: Context) {
    try {
      const id = c.req.param('id');
      const version = c.req.query('version')
        ? parseInt(c.req.query('version')!)
        : undefined;

      const prompt = await this.promptService.findById(id, version);

      if (!prompt) {
        return c.json({ success: false, error: 'Prompt not found' }, 404);
      }

      return c.json({ success: true, data: prompt });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async listPrompts(c: Context) {
    try {
      const category = c.req.query('category');
      const isActive = c.req.query('isActive')
        ? c.req.query('isActive') === 'true'
        : undefined;
      const tags = c.req.query('tags')
        ? c.req.query('tags')!.split(',')
        : undefined;
      const search = c.req.query('search');
      const limit = c.req.query('limit')
        ? parseInt(c.req.query('limit')!)
        : 50;
      const offset = c.req.query('offset')
        ? parseInt(c.req.query('offset')!)
        : 0;

      const prompts = await this.promptService.list({
        category,
        isActive,
        tags,
        search,
        limit,
        offset,
      });

      return c.json({ success: true, data: prompts });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async updatePrompt(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = updatePromptSchema.parse(body);

      const createNewVersion = c.req.query('createVersion') === 'true';
      const prompt = await this.promptService.update(id, validated, createNewVersion);

      return c.json({ success: true, data: prompt });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async deletePrompt(c: Context) {
    try {
      const id = c.req.param('id');
      await this.promptService.delete(id);

      return c.json({ success: true, message: 'Prompt deleted successfully' });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getVersions(c: Context) {
    try {
      const id = c.req.param('id');
      const versions = await this.promptService.getVersions(id);

      return c.json({ success: true, data: versions });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async rollbackPrompt(c: Context) {
    try {
      const id = c.req.param('id');
      const versionId = c.req.param('versionId');
      const version = parseInt(versionId);

      const prompt = await this.promptService.rollback(id, version);

      return c.json({ success: true, data: prompt });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async renderPrompt(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const validated = renderPromptSchema.parse(body);

      const rendered = await this.promptService.render(id, validated.variables, validated.version);

      return c.json({ success: true, data: rendered });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async getUsageStats(c: Context) {
    try {
      const id = c.req.param('id');
      const stats = await this.promptService.getUsageStats(id);

      return c.json({ success: true, data: stats });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
