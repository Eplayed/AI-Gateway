import { DashScopeClient } from '../dashscope/client.js';
import { countTokensSync, calculateCost } from '../token-counter/index.js';
import type {
  TextGenerationRequest,
  TextGenerationResponse,
  ChatRequest,
  ChatResponse,
  RetryConfig,
} from '@ai-gateway/core';

export class TextModelAdapter {
  constructor(
    private client: DashScopeClient,
    private defaultConfig: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    } = {},
  ) {}

  async textGeneration(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const startTime = Date.now();

    // 计算 Token
    const promptTokens = countTokensSync(request.prompt);

    // 调用 DashScope
    const response = await this.client.callGeneration(
      request.model,
      request.prompt,
      {
        temperature: request.config?.temperature ?? this.defaultConfig.temperature,
        topP: request.config?.topP ?? this.defaultConfig.topP,
        maxTokens: request.config?.maxTokens ?? this.defaultConfig.maxTokens,
      },
    );

    const content = response?.output?.text || '';
    const completionTokens = countTokensSync(content);
    const totalTokens = promptTokens + completionTokens;

    // 计算成本（使用默认定价，实际应从数据库获取）
    const pricing = {
      inputPricePer1kTokens: 0.0008,
      outputPricePer1kTokens: 0.0008,
    };
    const { inputCost, outputCost, totalCost } = calculateCost(promptTokens, completionTokens, pricing);

    return {
      content,
      model: request.model,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      finishReason: response?.usage?.finish_reason || 'stop',
      latencyMs: Date.now() - startTime,
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    // 转换消息格式
    const messages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 计算 Token（简化版，仅计算用户消息）
    const promptTokens = messages.reduce((sum, msg) => sum + countTokensSync(msg.content), 0);

    // 调用 DashScope
    const response = await this.client.callChat(
      request.model,
      messages,
      {
        temperature: request.config?.temperature ?? this.defaultConfig.temperature,
        topP: request.config?.topP ?? this.defaultConfig.topP,
        maxTokens: request.config?.maxTokens ?? this.defaultConfig.maxTokens,
        resultFormat: 'message',
      },
    );

    const output = response?.output;
    const assistantMessage = output?.choices?.[0]?.message || { role: 'assistant', content: '' };
    const content = assistantMessage.content || '';

    const completionTokens = countTokensSync(content);
    const totalTokens = promptTokens + completionTokens;

    // 计算成本
    const pricing = {
      inputPricePer1kTokens: 0.0008,
      outputPricePer1kTokens: 0.0008,
    };
    const { inputCost, outputCost, totalCost } = calculateCost(promptTokens, completionTokens, pricing);

    return {
      message: assistantMessage as any,
      model: request.model,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      finishReason: output?.finish_reason || 'stop',
      latencyMs: Date.now() - startTime,
    };
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<any, void, unknown> {
    // DashScope 流式输出实现
    const messages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await this.client.callChat(
      request.model,
      messages,
      {
        temperature: request.config?.temperature ?? this.defaultConfig.temperature,
        topP: request.config?.topP ?? this.defaultConfig.topP,
        maxTokens: request.config?.maxTokens ?? this.defaultConfig.maxTokens,
        resultFormat: 'message',
        incrementalOutput: true,
      },
    );

    // 流式输出
    // TODO: 实现 SSE 流式输出
    yield {
      type: 'token',
      content: response?.output?.text || '',
    };

    yield {
      type: 'done',
      done: true,
    };
  }
}
