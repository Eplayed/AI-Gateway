import { Hono } from 'hono';
import { PromptController } from '../controllers/prompt-controller.js';
import { PromptService } from '../services/prompt-service.js';
import { PromptRepository } from '@ai-gateway/infrastructure';
import { createPrismaClient } from '@ai-gateway/infrastructure';

const prisma = createPrismaClient();
const promptRepository = new PromptRepository(prisma);
const promptService = new PromptService(promptRepository);
const promptController = new PromptController(promptService);

const routes = new Hono();

routes.post('/prompts', (c) => promptController.createPrompt(c));
routes.get('/prompts/:id', (c) => promptController.getPrompt(c));
routes.get('/prompts', (c) => promptController.listPrompts(c));
routes.put('/prompts/:id', (c) => promptController.updatePrompt(c));
routes.delete('/prompts/:id', (c) => promptController.deletePrompt(c));
routes.get('/prompts/:id/versions', (c) => promptController.getVersions(c));
routes.post('/prompts/:id/rollback/:versionId', (c) => promptController.rollbackPrompt(c));
routes.post('/prompts/:id/render', (c) => promptController.renderPrompt(c));
routes.get('/prompts/:id/usage', (c) => promptController.getUsageStats(c));

export default routes;
