import * as DashScope from '@alicloud/dashscope20230314';
import * as OpenApi from '@alicloud/openapi-client';
import type { Logger } from '@ai-gateway/logger';

export interface DashScopeConfig {
  apiKey: string;
  endpoint?: string;
  region?: string;
}

export class DashScopeClient {
  private client: DashScope;
  private logger?: Logger;

  constructor(config: DashScopeConfig, logger?: Logger) {
    const openApiConfig = new OpenApi.Config({
      accessKeyId: config.apiKey,
      accessKeySecret: config.apiKey,
      endpoint: config.endpoint || 'dashscope.aliyuncs.com',
      regionId: config.region || 'cn-beijing',
    });

    this.client = new DashScope(openApiConfig);
    this.logger = logger;
  }

  getClient(): DashScope {
    return this.client;
  }

  async callChat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    params?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
      resultFormat?: 'message' | 'text';
    },
  ): Promise<any> {
    const request = new DashScope.CompletionRequest({
      model,
      messages: messages as any,
      temperature: params?.temperature ?? 0.7,
      topP: params?.topP,
      maxTokens: params?.maxTokens,
      resultFormat: params?.resultFormat ?? 'message',
    });

    const runtime = new OpenApi.RuntimeOptions({});

    try {
      const response = await this.client.completion(request, runtime);
      return response.body;
    } catch (error) {
      this.logger?.error({ error, model }, 'DashScope chat call failed');
      throw error;
    }
  }

  async callGeneration(
    model: string,
    prompt: string,
    params?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    },
  ): Promise<any> {
    const request = new DashScope.CompletionRequest({
      model,
      input: {
        messages: [{ role: 'user', content: prompt }],
      } as any,
      temperature: params?.temperature ?? 0.7,
      topP: params?.topP,
      maxTokens: params?.maxTokens,
    });

    const runtime = new OpenApi.RuntimeOptions({});

    try {
      const response = await this.client.completion(request, runtime);
      return response.body;
    } catch (error) {
      this.logger?.error({ error, model }, 'DashScope generation call failed');
      throw error;
    }
  }

  async callImageAnalysis(
    model: string,
    image: { type: 'url' | 'base64'; data: string },
    prompt: string,
    params?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    },
  ): Promise<any> {
    const message: any = {
      role: 'user',
      content: [
        {
          image: image.type === 'url' ? image.data : `data:image/jpeg;base64,${image.data}`,
        },
        { text: prompt },
      ],
    };

    const request = new DashScope.CompletionRequest({
      model,
      input: { messages: [message] } as any,
      temperature: params?.temperature ?? 0.7,
      topP: params?.topP,
      maxTokens: params?.maxTokens,
    });

    const runtime = new OpenApi.RuntimeOptions({});

    try {
      const response = await this.client.completion(request, runtime);
      return response.body;
    } catch (error) {
      this.logger?.error({ error, model }, 'DashScope image analysis call failed');
      throw error;
    }
  }
}
