import { Hono } from 'hono';
import type { Env, ApiResponse, Roadmap } from '../types/index.js';
import { getRecentRoadmaps, getRoadmapByUrl, deleteRoadmap } from '../services/index.js';

const roadmapsRoute = new Hono<{ Bindings: Env }>();

// GET /api/roadmaps - Get recent roadmaps
roadmapsRoute.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);
  const env = c.env;

  try {
    const roadmaps = await getRecentRoadmaps(Math.min(limit, 50), env);

    return c.json<ApiResponse<Roadmap[]>>({
      success: true,
      data: roadmaps,
    });
  } catch (error) {
    console.error('Fetch roadmaps error:', error);
    
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch roadmaps',
      },
      500
    );
  }
});

// GET /api/roadmaps/url - Get roadmap by GitHub URL
roadmapsRoute.get('/url', async (c) => {
  const githubUrl = c.req.query('url');
  const env = c.env;

  if (!githubUrl) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'GitHub URL is required',
      },
      400
    );
  }

  try {
    const roadmap = await getRoadmapByUrl(githubUrl, env);

    if (!roadmap) {
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Roadmap not found',
        },
        404
      );
    }

    return c.json<ApiResponse<Roadmap>>({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    console.error('Fetch roadmap error:', error);
    
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch roadmap',
      },
      500
    );
  }
});

// DELETE /api/roadmaps/:id - Delete a roadmap
roadmapsRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const env = c.env;

  try {
    const deleted = await deleteRoadmap(id, env);

    if (!deleted) {
      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Roadmap not found or already deleted',
        },
        404
      );
    }

    return c.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to delete roadmap',
      },
      500
    );
  }
});

export default roadmapsRoute;

