import type { Env, VoiceResponse } from '../types/index.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Pre-defined voice IDs for ElevenLabs
// Using "Adam" voice - a mature, professional male voice suitable for a "Senior Developer" persona
const MENTOR_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (deep, professional)

interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface ElevenLabsRequest {
  text: string;
  model_id: string;
  voice_settings: ElevenLabsVoiceSettings;
}

export async function generateVoiceAudio(
  text: string,
  env: Env,
  voiceId: string = MENTOR_VOICE_ID
): Promise<VoiceResponse> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Limit text length to avoid excessive API costs
  const truncatedText = text.length > 1000 ? text.slice(0, 1000) + '...' : text;

  const requestBody: ElevenLabsRequest = {
    text: truncatedText,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', errorText);
    
    // Try to parse error details
    let errorDetail = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail?.message) {
        errorDetail = errorJson.detail.message;
      }
      if (errorJson.detail?.status === 'quota_exceeded') {
        throw new Error('ElevenLabs quota exceeded. Voice generation is temporarily unavailable.');
      }
    } catch (parseError) {
      // Ignore parse errors, use raw text
    }
    
    if (response.status === 401) {
      throw new Error('Invalid ElevenLabs API key');
    }
    if (response.status === 429) {
      throw new Error('ElevenLabs rate limit exceeded');
    }
    if (response.status === 402 || response.status === 422) {
      throw new Error('ElevenLabs quota exceeded. Voice generation is temporarily unavailable.');
    }
    throw new Error(`ElevenLabs API error: ${errorDetail}`);
  }

  // Convert audio buffer to base64
  const audioBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(audioBuffer);
  
  // Convert to binary string in chunks to avoid stack overflow
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode(...chunk);
  }
  
  const base64Audio = btoa(binaryString);

  return {
    audioBase64: base64Audio,
  };
}

export async function generateMentorIntro(
  architectureSummary: string,
  repoName: string,
  env: Env
): Promise<VoiceResponse> {
  const mentorScript = `
    Welcome to ${repoName}! I'm your senior developer mentor, and I'll help you understand this codebase.
    
    ${architectureSummary}
    
    Take your time exploring the entry points I've identified. Remember, every expert was once a beginner. 
    Happy hacking!
  `.trim().replace(/\s+/g, ' ');

  return generateVoiceAudio(mentorScript, env, MENTOR_VOICE_ID);
}

export async function getAvailableVoices(
  env: Env
): Promise<Array<{ voice_id: string; name: string }>> {
  if (!env.ELEVENLABS_API_KEY) {
    return [];
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch voices:', response.statusText);
    return [];
  }

  const data = await response.json() as {
    voices: Array<{ voice_id: string; name: string }>;
  };
  
  return data.voices.map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
  }));
}

// Stream audio for real-time playback (returns a readable stream)
export async function streamVoiceAudio(
  text: string,
  env: Env,
  voiceId: string = MENTOR_VOICE_ID
): Promise<ReadableStream<Uint8Array> | null> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const requestBody: ElevenLabsRequest = {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
    },
  };

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs streaming error: ${response.statusText}`);
  }

  return response.body;
}
