import { Hono } from 'hono';
import { InferenceController } from '../controllers/inference-controller.js';
import { UsageController } from '../controllers/usage-controller.js';
import { InferenceService } from '../services/inference-service.js';

const inferenceService = new InferenceService();
const inferenceController = new InferenceController(inferenceService);
const usageController = new UsageController();

const routes = new Hono();

// Inference endpoints
routes.post('/inference/chat', (c) => inferenceController.chat(c));
routes.post('/inference/text', (c) => inferenceController.textGeneration(c));
routes.post('/inference/image-analysis', (c) => inferenceController.imageAnalysis(c));
routes.post('/inference/estimate-cost', (c) => inferenceController.estimateCost(c));

// Usage endpoints
routes.get('/usage/token', (c) => usageController.getTokenUsage(c));
routes.get('/usage/cost', (c) => usageController.getCost(c));

export default routes;
