import { InferenceService } from '../services/inference-service.js';
import { z } from 'zod';
import type { Context } from 'hono';

const chatSchema = z.object({
  model: z.string().default('qwen-turbo'),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    }),
  ),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
});

const textGenerationSchema = z.object({
  model: z.string().default('qwen-turbo'),
  prompt: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
});

const imageAnalysisSchema = z.object({
  model: z.string().default('qwen-vl-plus'),
  image: z.object({
    type: z.enum(['url', 'base64']),
    data: z.string(),
  }),
  prompt: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
});

const costEstimateSchema = z.object({
  input: z.string(),
  modelId: z.string().default('qwen-turbo'),
});

export class InferenceController {
  constructor(private inferenceService: InferenceService) {}

  async chat(c: Context) {
    try {
      const body = await c.req.json();
      const validated = chatSchema.parse(body);
      const apiKeyId = c.get('apiKeyId');

      const result = await this.inferenceService.chat(
        validated.messages,
        {
          model: validated.model,
          temperature: validated.temperature,
          topP: validated.topP,
          maxTokens: validated.maxTokens,
        },
        apiKeyId,
      );

      return c.json({
        success: true,
        data: {
          message: result.message,
          model: result.model,
          tokens: result.tokens,
          finishReason: result.finishReason,
          latencyMs: result.latencyMs,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async textGeneration(c: Context) {
    try {
      const body = await c.req.json();
      const validated = textGenerationSchema.parse(body);
      const apiKeyId = c.get('apiKeyId');

      const result = await this.inferenceService.textGeneration(
        validated.prompt,
        {
          model: validated.model,
          temperature: validated.temperature,
          topP: validated.topP,
          maxTokens: validated.maxTokens,
        },
        apiKeyId,
      );

      return c.json({
        success: true,
        data: {
          content: result.content,
          model: result.model,
          tokens: result.tokens,
          finishReason: result.finishReason,
          latencyMs: result.latencyMs,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async imageAnalysis(c: Context) {
    try {
      const body = await c.req.json();
      const validated = imageAnalysisSchema.parse(body);
      const apiKeyId = c.get('apiKeyId');

      const result = await this.inferenceService.imageAnalysis(
        validated.image,
        validated.prompt,
        {
          model: validated.model,
          temperature: validated.temperature,
          topP: validated.topP,
          maxTokens: validated.maxTokens,
        },
        apiKeyId,
      );

      return c.json({
        success: true,
        data: {
          content: result.content,
          model: result.model,
          tokens: result.tokens,
          latencyMs: result.latencyMs,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  async estimateCost(c: Context) {
    try {
      const body = await c.req.json();
      const validated = costEstimateSchema.parse(body);

      const estimate = await this.inferenceService.estimateCost(
        validated.input,
        validated.modelId,
      );

      return c.json({
        success: true,
        data: {
          inputTokens: estimate.inputTokens,
          estimatedOutputTokens: estimate.estimatedOutputTokens,
          estimatedCost: estimate.estimatedCost,
          currency: estimate.currency,
          confidence: estimate.confidence,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json({ success: false, error: error.errors }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
