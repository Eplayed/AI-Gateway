import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createLogger } from '@ai-gateway/logger';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import dotenv from 'dotenv';

dotenv.config();

const logger = createLogger({
  level: (process.env.LOG_LEVEL as any) || 'info',
  format: 'json',
  service: 'api-gateway',
});

const app = new Hono();

app.use('*', errorHandler);
app.use('/api/v1/*', loggerMiddleware);
app.use('/api/v1/*', authMiddleware);
app.use('/api/v1/*', rateLimitMiddleware());

app.route('/api/v1', routes);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api-gateway', timestamp: Date.now() });
});

app.get('/', (c) => {
  return c.json({
    name: 'AI Gateway',
    version: '0.1.0',
    endpoints: {
      inference: '/api/v1/inference',
      usage: '/api/v1/usage',
    },
  });
});

const port = parseInt(process.env.PORT || '3000');

logger.info({ port }, 'Starting API Gateway service...');

serve({
  fetch: app.fetch,
  port,
});

logger.info({ port }, 'API Gateway service started');
