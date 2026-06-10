import type { ApiResponse, Roadmap, VoiceResponse } from '@/types';

// Use internal URL for server-side requests (Docker network) and public URL for client-side (browser)
const getApiUrl = () => {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function analyzeRepository(
  githubUrl: string,
  forceRefresh = false
): Promise<ApiResponse<Roadmap>> {
  return fetchApi<Roadmap>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ githubUrl, forceRefresh }),
  });
}

export async function getRecentRoadmaps(
  limit = 10
): Promise<ApiResponse<Roadmap[]>> {
  return fetchApi<Roadmap[]>(`/api/roadmaps?limit=${limit}`);
}

export async function getRoadmapByUrl(
  githubUrl: string
): Promise<ApiResponse<Roadmap>> {
  return fetchApi<Roadmap>(
    `/api/roadmaps/url?url=${encodeURIComponent(githubUrl)}`
  );
}

export async function deleteRoadmap(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return fetchApi<{ deleted: boolean }>(`/api/roadmaps/${id}`, {
    method: 'DELETE',
  });
}

export async function generateMentorVoice(
  architectureSummary: string,
  repoName: string
): Promise<ApiResponse<VoiceResponse>> {
  return fetchApi<VoiceResponse>('/api/voice/mentor', {
    method: 'POST',
    body: JSON.stringify({ architectureSummary, repoName }),
  });
}

export function getVoiceStreamUrl(text: string): string {
  const apiUrl = getApiUrl();
  return `${apiUrl}/api/voice/stream?text=${encodeURIComponent(text)}`;
}
