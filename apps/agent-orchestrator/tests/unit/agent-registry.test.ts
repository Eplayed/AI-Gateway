import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRegistry } from '../../src/services/agent-registry.js';
import { Agent, AgentStatus, CapabilityType } from '@ai-gateway/core';

// Mock AgentRepository
const mockAgentRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const agentRegistry = new AgentRegistry(mockAgentRepository as any);

describe('AgentRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRegistry['agents'].clear();
  });

  describe('registerAgent', () => {
    it('should register a new agent', async () => {
      const agent: Agent = {
        id: 'agent-001',
        name: 'Test Agent',
        description: 'Test Description',
        status: AgentStatus.IDLE,
        capabilities: [
          {
            type: CapabilityType.TEXT_GENERATION,
            models: ['qwen-turbo'],
            priority: 1,
          },
        ],
        config: {
          maxConcurrentTasks: 1,
          timeoutMs: 60000,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000,
            backoffMultiplier: 2,
          },
          modelPreferences: [
            {
              modelId: 'qwen-turbo',
              priority: 1,
              costTier: 'low' as any,
            },
          ],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockAgentRepository.findById.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(agent);

      await agentRegistry.registerAgent(agent);

      expect(agentRegistry.isAgentRegistered('agent-001')).toBe(true);
      expect(mockAgentRepository.create).toHaveBeenCalledWith(agent);
    });

    it('should update existing agent', async () => {
      const existingAgent: Agent = {
        id: 'agent-001',
        name: 'Test Agent',
        description: 'Old Description',
        status: AgentStatus.IDLE,
        capabilities: [],
        config: {
          maxConcurrentTasks: 1,
          timeoutMs: 60000,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000,
            backoffMultiplier: 2,
          },
          modelPreferences: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedAgent: Agent = {
        ...existingAgent,
        description: 'New Description',
      };

      mockAgentRepository.findById.mockResolvedValue(existingAgent);
      mockAgentRepository.update.mockResolvedValue(updatedAgent);

      await agentRegistry.registerAgent(updatedAgent);

      expect(mockAgentRepository.update).toHaveBeenCalledWith('agent-001', updatedAgent);
    });
  });

  describe('getAgent', () => {
    it('should return registered agent', async () => {
      const agent: Agent = {
        id: 'agent-001',
        name: 'Test Agent',
        description: 'Test',
        status: AgentStatus.IDLE,
        capabilities: [],
        config: {
          maxConcurrentTasks: 1,
          timeoutMs: 60000,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000,
            backoffMultiplier: 2,
          },
          modelPreferences: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockAgentRepository.findById.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(agent);

      await agentRegistry.registerAgent(agent);

      const result = await agentRegistry.getAgent('agent-001');

      expect(result).toEqual(agent);
    });

    it('should return null for non-existent agent', () => {
      const result = agentRegistry.getAgent('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister agent', async () => {
      const agent: Agent = {
        id: 'agent-001',
        name: 'Test Agent',
        description: 'Test',
        status: AgentStatus.IDLE,
        capabilities: [],
        config: {
          maxConcurrentTasks: 1,
          timeoutMs: 60000,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000,
            backoffMultiplier: 2,
          },
          modelPreferences: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockAgentRepository.findById.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(agent);
      mockAgentRepository.delete.mockResolvedValue(undefined);

      await agentRegistry.registerAgent(agent);
      await agentRegistry.unregisterAgent('agent-001');

      expect(agentRegistry.isAgentRegistered('agent-001')).toBe(false);
      expect(mockAgentRepository.delete).toHaveBeenCalledWith('agent-001');
    });
  });

  describe('getRegisteredAgentsCount', () => {
    it('should return correct count', async () => {
      expect(agentRegistry.getRegisteredAgentsCount()).toBe(0);

      const agent: Agent = {
        id: 'agent-001',
        name: 'Test Agent',
        description: 'Test',
        status: AgentStatus.IDLE,
        capabilities: [],
        config: {
          maxConcurrentTasks: 1,
          timeoutMs: 60000,
          retryPolicy: {
            maxRetries: 3,
            backoffMs: 1000,
            backoffMultiplier: 2,
          },
          modelPreferences: [],
        },
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockAgentRepository.findById.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(agent);

      await agentRegistry.registerAgent(agent);

      expect(agentRegistry.getRegisteredAgentsCount()).toBe(1);
    });
  });
});
