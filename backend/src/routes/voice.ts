import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, ApiResponse, VoiceResponse } from '../types/index.js';
import { generateMentorIntro, streamVoiceAudio } from '../services/index.js';

const voiceRoute = new Hono<{ Bindings: Env }>();

// Request validation schema
const voiceRequestSchema = z.object({
  architectureSummary: z.string().min(10).max(2000),
  repoName: z.string().min(1),
});

const customVoiceSchema = z.object({
  text: z.string().min(10).max(2000),
  voiceId: z.string().optional(),
});

// POST /api/voice/mentor - Generate mentor introduction audio
voiceRoute.post(
  '/mentor',
  zValidator('json', voiceRequestSchema),
  async (c) => {
    const { architectureSummary, repoName } = c.req.valid('json');
    const env = c.env;

    try {
      const voiceResponse = await generateMentorIntro(
        architectureSummary,
        repoName,
        env
      );

      return c.json<ApiResponse<VoiceResponse>>({
        success: true,
        data: voiceResponse,
      });
    } catch (error) {
      console.error('Voice generation error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate voice audio';

      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: errorMessage,
        },
        500
      );
    }
  }
);

// POST /api/voice/custom - Generate custom voice audio
voiceRoute.post(
  '/custom',
  zValidator('json', customVoiceSchema),
  async (c) => {
    const { text, voiceId } = c.req.valid('json');
    const env = c.env;

    try {
      const stream = await streamVoiceAudio(text, env, voiceId);
      
      if (!stream) {
        throw new Error('Failed to generate audio stream');
      }

      return new Response(stream, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (error) {
      console.error('Voice streaming error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to stream voice audio';

      return c.json<ApiResponse<never>>(
        {
          success: false,
          error: errorMessage,
        },
        500
      );
    }
  }
);

// GET /api/voice/stream - Stream audio for given text (query params)
voiceRoute.get('/stream', async (c) => {
  const text = c.req.query('text');
  const voiceId = c.req.query('voiceId');
  const env = c.env;

  if (!text || text.length < 10) {
    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Text parameter is required (minimum 10 characters)',
      },
      400
    );
  }

  try {
    const stream = await streamVoiceAudio(text, env, voiceId);
    
    if (!stream) {
      throw new Error('Failed to generate audio stream');
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Voice streaming error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to stream voice audio';

    return c.json<ApiResponse<never>>(
      {
        success: false,
        error: errorMessage,
      },
      500
    );
  }
});

export default voiceRoute;

