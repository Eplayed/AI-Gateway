import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createLogger } from '@ai-gateway/logger';
import routes from './routes/index.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import dotenv from 'dotenv';

dotenv.config();

const logger = createLogger({
  level: (process.env.LOG_LEVEL as any) || 'info',
  format: 'json',
  service: 'prompt-manager',
});

const app = new Hono();

app.use('*', errorHandler);
app.use('/api/v1/*', loggerMiddleware);

app.route('/api/v1', routes);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'prompt-manager', timestamp: Date.now() });
});

app.get('/', (c) => {
  return c.json({
    name: 'AI Gateway - Prompt Manager',
    version: '0.1.0',
    endpoints: {
      prompts: '/api/v1/prompts',
    },
  });
});

const port = parseInt(process.env.PORT || '3002');

logger.info({ port }, 'Starting Prompt Manager service...');

serve({
  fetch: app.fetch,
  port,
});

logger.info({ port }, 'Prompt Manager service started');
