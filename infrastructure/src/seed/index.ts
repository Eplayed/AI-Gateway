import { createPrismaClient } from '../client.js';
import type { Model, ModelProvider, ModelType, ModelCapability } from '@ai-gateway/core';

const prisma = createPrismaClient();

const models: Omit<Model, 'id'>[] = [
  {
    modelId: 'qwen-turbo',
    name: 'Qwen Turbo',
    provider: ModelProvider.DASHSCOPE,
    type: ModelType.TEXT,
    capabilities: [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.STREAMING,
    ],
    pricing: {
      inputPricePer1kTokens: 0.0008,
      outputPricePer1kTokens: 0.0008,
      currency: 'CNY',
    },
    rateLimit: {
      requestsPerMinute: 300,
      tokensPerMinute: 120000,
    },
    config: {
      maxTokens: 2000,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      supportedParameters: ['temperature', 'topP', 'maxTokens'],
    },
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    modelId: 'qwen-plus',
    name: 'Qwen Plus',
    provider: ModelProvider.DASHSCOPE,
    type: ModelType.TEXT,
    capabilities: [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.STREAMING,
    ],
    pricing: {
      inputPricePer1kTokens: 0.004,
      outputPricePer1kTokens: 0.006,
      currency: 'CNY',
    },
    rateLimit: {
      requestsPerMinute: 100,
      tokensPerMinute: 100000,
    },
    config: {
      maxTokens: 6000,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      supportedParameters: ['temperature', 'topP', 'maxTokens'],
    },
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    modelId: 'qwen-max',
    name: 'Qwen Max',
    provider: ModelProvider.DASHSCOPE,
    type: ModelType.TEXT,
    capabilities: [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING,
      ModelCapability.STREAMING,
    ],
    pricing: {
      inputPricePer1kTokens: 0.02,
      outputPricePer1kTokens: 0.06,
      currency: 'CNY',
    },
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 50000,
    },
    config: {
      maxTokens: 8000,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      supportedParameters: ['temperature', 'topP', 'maxTokens'],
    },
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    modelId: 'qwen-vl-plus',
    name: 'Qwen VL Plus',
    provider: ModelProvider.DASHSCOPE,
    type: ModelType.MULTIMODAL,
    capabilities: [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.IMAGE_ANALYSIS,
      ModelCapability.STREAMING,
    ],
    pricing: {
      inputPricePer1kTokens: 0.008,
      outputPricePer1kTokens: 0.008,
      currency: 'CNY',
    },
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 80000,
    },
    config: {
      maxTokens: 4000,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      supportedParameters: ['temperature', 'topP', 'maxTokens'],
    },
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

async function seedModels() {
  console.log('🌱 Seeding models...');

  for (const model of models) {
    await prisma.model.upsert({
      where: { modelId: model.modelId },
      update: {
        name: model.name,
        pricing: model.pricing as any,
        rateLimit: model.rateLimit as any,
        config: model.config as any,
        isActive: model.isActive,
        updatedAt: new Date(),
      },
      create: {
        modelId: model.modelId,
        name: model.name,
        provider: model.provider,
        type: model.type,
        capabilities: model.capabilities as any,
        pricing: model.pricing as any,
        rateLimit: model.rateLimit as any,
        config: model.config as any,
        isActive: model.isActive,
      },
    });
    console.log(`✅ Created/updated model: ${model.modelId}`);
  }

  console.log('✨ Models seeded successfully!');
}

async function seedModelRoute() {
  console.log('🌱 Seeding model routes...');

  const qwenTurbo = await prisma.model.findUnique({ where: { modelId: 'qwen-turbo' } });
  const qwenPlus = await prisma.model.findUnique({ where: { modelId: 'qwen-plus' } });

  if (!qwenTurbo || !qwenPlus) {
    console.warn('⚠️  Models not found, skipping route seeding');
    return;
  }

  await prisma.modelRoute.upsert({
    where: { id: 'default-cost-first-route' },
    update: {},
    create: {
      id: 'default-cost-first-route',
      name: 'Default Cost-First Route',
      description: '优先使用低成本模型，用于通用场景',
      strategy: 'cost_first',
      rules: [
        {
          condition: 'default',
          modelId: qwenTurbo.id,
          priority: 1,
        },
      ],
      defaultModelId: qwenTurbo.id,
      fallbackModelId: qwenPlus.id,
      isActive: true,
      priority: 100,
    },
  });

  console.log('✨ Model route seeded successfully!');
}

async function seedTestApiKey() {
  console.log('🌱 Seeding test API key...');

  const testApiKey = 'sk-test-' + Math.random().toString(36).substring(2);

  await prisma.apiKey.upsert({
    where: { key: testApiKey },
    update: {},
    create: {
      key: testApiKey,
      name: 'Test API Key',
      description: 'Generated for development and testing',
      isActive: true,
      userId: 'test-user-001',
    },
  });

  console.log(`✨ Test API key created: ${testApiKey}`);
  console.log('📝 Please copy this key for testing in your .env file');
}

async function main() {
  try {
    await seedModels();
    await seedModelRoute();
    await seedTestApiKey();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
