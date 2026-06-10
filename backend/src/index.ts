import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import 'dotenv/config';
import type { Env } from './types/index.js';
import analyzeRoute from './routes/analyze.js';
import voiceRoute from './routes/voice.js';
import roadmapsRoute from './routes/roadmaps.js';
import healthRoute from './routes/health.js';

// Load environment variables
const env: Env = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT || '',
  SNOWFLAKE_USER: process.env.SNOWFLAKE_USER || '',
  SNOWFLAKE_PASSWORD: process.env.SNOWFLAKE_PASSWORD || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
};

// Define context variables type
type Variables = {
  env: Env;
};

const app = new Hono<{ Variables: Variables }>();

// Inject env into context
app.use('*', async (c, next) => {
  c.set('env', env);
  await next();
});

// Helper to get env from context
app.use('*', async (c, next) => {
  c.env = c.get('env') as Env;
  await next();
});

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS configuration
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://openroad-agent.vercel.app'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'OpenRoad Agent API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/analyze', analyzeRoute);
app.route('/api/voice', voiceRoute);
app.route('/api/roadmaps', roadmapsRoute);
app.route('/api/health', healthRoute);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  const environment = c.get('env')?.ENVIRONMENT || 'production';
  
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: environment === 'development' ? err.message : 'An unexpected error occurred',
    },
    500
  );
});

// Start server for Node.js
const port = parseInt(process.env.PORT || '8787', 10);

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 OpenRoad Agent API running on http://localhost:${port}`);

export default app;
