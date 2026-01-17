import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptService } from '../../src/services/prompt-service.js';

// Mock PromptRepository
const mockPromptRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getVersions: vi.fn(),
  rollback: vi.fn(),
};

const promptService = new PromptService(mockPromptRepository as any);

describe('PromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        name: 'Test Prompt',
        description: 'Test Description',
        category: 'chat' as const,
        template: 'Hello {{name}}',
        isActive: true,
        tags: ['test'],
      };

      const expectedResult = {
        id: 'prompt-001',
        ...promptData,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockPromptRepository.create.mockResolvedValue(expectedResult);

      const result = await promptService.create(promptData);

      expect(result).toEqual(expectedResult);
      expect(mockPromptRepository.create).toHaveBeenCalledWith(promptData);
    });
  });

  describe('findById', () => {
    it('should find a prompt by id', async () => {
      const prompt = {
        id: 'prompt-001',
        name: 'Test Prompt',
        description: 'Test Description',
        category: 'chat' as const,
        template: 'Hello {{name}}',
        isActive: true,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        variables: [],
      };

      mockPromptRepository.findById.mockResolvedValue(prompt);

      const result = await promptService.findById('prompt-001');

      expect(result).toEqual(prompt);
      expect(mockPromptRepository.findById).toHaveBeenCalledWith('prompt-001');
    });

    it('should return null if prompt not found', async () => {
      mockPromptRepository.findById.mockResolvedValue(null);

      const result = await promptService.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list prompts with filters', async () => {
      const prompts = [
        {
          id: 'prompt-001',
          name: 'Test Prompt',
          description: 'Test',
          category: 'chat' as const,
          template: 'Hello',
          isActive: true,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          variables: [],
        },
      ];

      mockPromptRepository.list.mockResolvedValue(prompts);

      const result = await promptService.list({
        category: 'chat',
        isActive: true,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(prompts);
      expect(mockPromptRepository.list).toHaveBeenCalledWith({
        category: 'chat',
        isActive: true,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('render', () => {
    it('should render prompt with variables', async () => {
      const prompt = {
        id: 'prompt-001',
        name: 'Test Prompt',
        description: 'Test',
        category: 'chat' as const,
        template: 'Hello {{name}}, welcome to {{place}}!',
        isActive: true,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        variables: [],
      };

      mockPromptRepository.findById.mockResolvedValue(prompt);

      const result = await promptService.render('prompt-001', {
        name: 'Alice',
        place: 'Wonderland',
      });

      expect(result.renderedText).toBe('Hello Alice, welcome to Wonderland!');
      expect(result.version).toBe(1);
    });
  });
});
