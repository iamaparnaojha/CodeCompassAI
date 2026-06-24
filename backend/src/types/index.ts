// Type definitions for CodeCompassAI

// Hono context type — use Variables (not Bindings) for Node.js runtime
export type AppEnv = {
  Variables: {
    env: Env;
  };
};

export interface Env {
  GITHUB_TOKEN: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  MONGODB_URI: string;
  SNOWFLAKE_ACCOUNT: string;
  SNOWFLAKE_USER: string;
  SNOWFLAKE_PASSWORD: string;
  ELEVENLABS_API_KEY: string;
  ENVIRONMENT: string;
}

export interface GitHubFile {
  path: string;
  type: 'file' | 'dir';
  name: string;
  size?: number;
}

export interface GitHubRepoContext {
  readme: string;
  fileTree: GitHubFile[];
  repoName: string;
  owner: string;
}

export interface GeminiAnalysis {
  techStack: string[];
  architectureSummary: string;
  dataFlow: string;
  entryPoints: EntryPoint[];
}

export interface EntryPoint {
  file: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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
  createdAt: Date;
  updatedAt: Date;
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
