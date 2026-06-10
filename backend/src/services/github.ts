import type { Env, GitHubRepoContext, GitHubFile } from '../types/index.js';

// Files to filter out from the file tree
const IGNORED_PATTERNS = [
  /^\.git\//,
  /node_modules/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.ico$/i,
  /\.woff$/i,
  /\.woff2$/i,
  /\.ttf$/i,
  /\.eot$/i,
  /\.mp3$/i,
  /\.mp4$/i,
  /\.webm$/i,
  /\.pdf$/i,
  /\.zip$/i,
  /\.tar$/i,
  /\.gz$/i,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^\.editorconfig$/,
  /^\.prettierignore$/,
  /^\.eslintignore$/,
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
];

function shouldIncludeFile(path: string): boolean {
  return !IGNORED_PATTERNS.some((pattern) => pattern.test(path));
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/,
    /github\.com\/([^\/]+)\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  token: string
): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'OpenRoad-Agent/1.0',
    },
  });
}

async function fetchReadme(
  owner: string,
  repo: string,
  token: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const response = await fetchWithAuth(url, token);

  if (!response.ok) {
    if (response.status === 404) {
      return 'No README found for this repository.';
    }
    throw new Error(`Failed to fetch README: ${response.statusText}`);
  }

  const data = await response.json() as { content: string; encoding: string };
  
  if (data.encoding === 'base64') {
    return atob(data.content);
  }
  
  return data.content;
}

async function fetchFileTree(
  owner: string,
  repo: string,
  token: string,
  path: string = '',
  depth: number = 0,
  maxDepth: number = 3
): Promise<GitHubFile[]> {
  if (depth >= maxDepth) {
    return [];
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetchWithAuth(url, token);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch file tree: ${response.statusText}`);
  }

  const contents = await response.json() as Array<{
    path: string;
    type: 'file' | 'dir';
    name: string;
    size?: number;
  }>;

  if (!Array.isArray(contents)) {
    return [];
  }

  const files: GitHubFile[] = [];

  for (const item of contents) {
    const fullPath = item.path;
    
    if (!shouldIncludeFile(fullPath)) {
      continue;
    }

    files.push({
      path: fullPath,
      type: item.type,
      name: item.name,
      size: item.size,
    });

    if (item.type === 'dir' && depth < maxDepth - 1) {
      const subFiles = await fetchFileTree(
        owner,
        repo,
        token,
        fullPath,
        depth + 1,
        maxDepth
      );
      files.push(...subFiles);
    }
  }

  return files;
}

export async function fetchGitHubRepo(
  githubUrl: string,
  env: Env
): Promise<GitHubRepoContext> {
  const parsed = parseGitHubUrl(githubUrl);
  
  if (!parsed) {
    throw new Error('Invalid GitHub URL. Please provide a valid repository URL.');
  }

  const { owner, repo } = parsed;

  // Verify the repository exists and is accessible
  const repoResponse = await fetchWithAuth(
    `https://api.github.com/repos/${owner}/${repo}`,
    env.GITHUB_TOKEN
  );

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      throw new Error('Repository not found. It may be private or does not exist.');
    }
    if (repoResponse.status === 403) {
      throw new Error('Access denied. The repository may be private.');
    }
    throw new Error(`Failed to access repository: ${repoResponse.statusText}`);
  }

  // Fetch README and file tree in parallel
  const [readme, fileTree] = await Promise.all([
    fetchReadme(owner, repo, env.GITHUB_TOKEN),
    fetchFileTree(owner, repo, env.GITHUB_TOKEN),
  ]);

  return {
    readme,
    fileTree,
    repoName: repo,
    owner,
  };
}

export { parseGitHubUrl };
