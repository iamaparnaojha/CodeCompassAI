import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Roadmap, ApiResponse } from '../types/index.js';
import {
  fetchGitHubRepo,
  analyzeWithGemini,
  getFileHealthMetrics,
  saveRoadmap,
  getCachedRoadmap,
} from '../services/index.js';

const analyzeRoute = new Hono<{ Bindings: Env }>();

// Request validation schema
const analyzeRequestSchema = z.object({
  githubUrl: z.string().url().refine(
    (url) => url.includes('github.com'),
    { message: 'Must be a valid GitHub URL' }
  ),
  forceRefresh: z.boolean().optional().default(false),
});

// POST /api/analyze - Analyze a GitHub repository
analyzeRoute.post(
  '/',
  zValidator('json', analyzeRequestSchema),
  async (c) => {
    const { githubUrl, forceRefresh } = c.req.valid('json');
    const env = c.env;

    try {
      // Check for cached roadmap first (unless force refresh is requested)
      if (!forceRefresh) {
        const cached = await getCachedRoadmap(githubUrl, env);
        if (cached) {
          return c.json<ApiResponse<Roadmap>>({
            success: true,
            data: cached,
          });
        }
      }

      // Step 1: Fetch repository context from GitHub
      console.log('Fetching repository:', githubUrl);
      const repoContext = await fetchGitHubRepo(githubUrl, env);

      // Step 2: Analyze with Gemini
      console.log('Analyzing with Gemini...');
      const analysis = await analyzeWithGemini(repoContext, env);

      // Step 3: Get health metrics for entry points
      console.log('Fetching health metrics...');
      const healthMetrics = await getFileHealthMetrics(
        analysis.entryPoints,
        repoContext.repoName,
        env
      );

      // Step 4: Create roadmap object
      const roadmap: Omit<Roadmap, '_id'> = {
        githubUrl,
        repoName: repoContext.repoName,
        owner: repoContext.owner,
        analysis,
        healthMetrics,
        fileTree: repoContext.fileTree,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Step 5: Save to MongoDB
      console.log('Saving roadmap...');
      const savedRoadmap = await saveRoadmap(roadmap, env);

      return c.json<ApiResponse<Roadmap>>({
        success: true,
        data: savedRoadmap,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: errorMessage,
        },
        error instanceof Error && error.message.includes('not found') ? 404 : 500
      );
    }
  }
);

// GET /api/analyze/:owner/:repo - Analyze by owner/repo
analyzeRoute.get('/:owner/:repo', async (c) => {
  const { owner, repo } = c.req.param();
  const githubUrl = `https://github.com/${owner}/${repo}`;
  const env = c.env;

  try {
    // Check for cached roadmap
    const cached = await getCachedRoadmap(githubUrl, env);
    if (cached) {
      return c.json<ApiResponse<Roadmap>>({
        success: true,
        data: cached,
      });
    }

    // Fetch and analyze
    const repoContext = await fetchGitHubRepo(githubUrl, env);
    const analysis = await analyzeWithGemini(repoContext, env);
    const healthMetrics = await getFileHealthMetrics(
      analysis.entryPoints,
      repoContext.repoName,
      env
    );

    const roadmap: Omit<Roadmap, '_id'> = {
      githubUrl,
      repoName: repoContext.repoName,
      owner: repoContext.owner,
      analysis,
      healthMetrics,
      fileTree: repoContext.fileTree,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedRoadmap = await saveRoadmap(roadmap, env);

    return c.json<ApiResponse<Roadmap>>({
      success: true,
      data: savedRoadmap,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: errorMessage,
      },
      500
    );
  }
});

export default analyzeRoute;

