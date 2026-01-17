import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createLogger } from '@ai-gateway/logger';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import dotenv from 'dotenv';

dotenv.config();

const logger = createLogger({
  level: (process.env.LOG_LEVEL as any) || 'info',
  format: 'json',
  service: 'agent-orchestrator',
});

const app = new Hono();

app.use('*', errorHandler);
app.use('/api/v1/*', loggerMiddleware);
app.use('/api/v1/*', authMiddleware);

app.route('/api/v1', routes);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'agent-orchestrator', timestamp: Date.now() });
});

app.get('/', (c) => {
  return c.json({
    name: 'AI Gateway - Agent Orchestrator',
    version: '0.1.0',
    endpoints: {
      agents: '/api/v1/agents',
    },
  });
});

const port = parseInt(process.env.PORT || '3001');

logger.info({ port }, 'Starting Agent Orchestrator service...');

serve({
  fetch: app.fetch,
  port,
});

logger.info({ port }, 'Agent Orchestrator service started');
