import { Hono } from 'hono';
import { AgentController } from '../controllers/agent-controller.js';
import { authMiddleware } from '../middleware/auth.js';

const agentController = new AgentController();

const routes = new Hono();

// Agent endpoints
routes.post('/agents', (c) => agentController.createAgent(c));
routes.get('/agents', (c) => agentController.listAgents(c));
routes.get('/agents/:agentId', (c) => agentController.getAgent(c));
routes.delete('/agents/:agentId', (c) => agentController.deleteAgent(c));
routes.post('/agents/:agentId/invoke', (c) => agentController.invokeAgent(c));
routes.get('/agents/stats', (c) => agentController.getRegistryStats(c));

export default routes;
