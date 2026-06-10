// Shared types between frontend and backend

export interface GitHubFile {
  path: string;
  type: 'file' | 'dir';
  name: string;
  size?: number;
}

export interface EntryPoint {
  file: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeminiAnalysis {
  techStack: string[];
  architectureSummary: string;
  dataFlow: string;
  entryPoints: EntryPoint[];
}

export interface HealthMetrics {
  file: string;
  fileChurn: number;
  bugFrequency: number;
  status: 'hot' | 'stable' | 'moderate';
}

export interface Roadmap {
  _id?: string;
  githubUrl: string;
  repoName: string;
  owner: string;
  analysis: GeminiAnalysis;
  healthMetrics: HealthMetrics[];
  fileTree: GitHubFile[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VoiceResponse {
  audioUrl?: string;
  audioBase64?: string;
}
