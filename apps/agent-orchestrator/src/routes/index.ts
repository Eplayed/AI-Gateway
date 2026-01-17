import { Hono } from 'hono';
import { AgentController, WorkflowController } from '../controllers/index.js';

const agentController = new AgentController();
const workflowController = new WorkflowController();

const routes = new Hono();

// Agent endpoints
routes.post('/agents', (c) => agentController.createAgent(c));
routes.get('/agents', (c) => agentController.listAgents(c));
routes.get('/agents/:agentId', (c) => agentController.getAgent(c));
routes.delete('/agents/:agentId', (c) => agentController.deleteAgent(c));
routes.post('/agents/:agentId/invoke', (c) => agentController.invokeAgent(c));
routes.get('/agents/stats', (c) => agentController.getRegistryStats(c));

// Workflow endpoints
routes.post('/workflows', (c) => workflowController.createWorkflow(c));
routes.post('/workflows/:id/execute', (c) => workflowController.executeWorkflow(c));
routes.get('/workflows/:executionId', (c) => workflowController.getExecution(c));
routes.get('/workflows/:id/executions', (c) => workflowController.listExecutions(c));

export default routes;
