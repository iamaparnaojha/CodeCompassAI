import { Hono } from 'hono';
import type { Env, ApiResponse, HealthMetrics } from '../types/index.js';
import { getFileHealthMetrics, getRepoHealthOverview } from '../services/index.js';

const healthRoute = new Hono<{ Bindings: Env }>();

// POST /api/health/files - Get health metrics for specific files
healthRoute.post('/files', async (c) => {
  const body = await c.req.json<{
    files: string[];
    repoName: string;
  }>();
  const env = c.env;

  if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Files array is required',
      },
      400
    );
  }

  if (!body.repoName) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Repository name is required',
      },
      400
    );
  }

  try {
    // Convert files array to entry points format
    const entryPoints = body.files.map((file) => ({
      file,
      description: '',
      difficulty: 'intermediate' as const,
    }));

    const metrics = await getFileHealthMetrics(entryPoints, body.repoName, env);

    return c.json<ApiResponse<HealthMetrics[]>>({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Health metrics error:', error);
    
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch health metrics',
      },
      500
    );
  }
});

// GET /api/health/repo/:repoName - Get repository health overview
healthRoute.get('/repo/:repoName', async (c) => {
  const repoName = c.req.param('repoName');
  const env = c.env;

  try {
    const overview = await getRepoHealthOverview(repoName, env);

    return c.json<ApiResponse<typeof overview>>({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Repo health error:', error);
    
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch repository health overview',
      },
      500
    );
  }
});

export default healthRoute;

