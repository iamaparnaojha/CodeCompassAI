import type { Env, HealthMetrics, EntryPoint } from '../types/index.js';

// Snowflake REST API SQL Endpoint
const SNOWFLAKE_SQL_API = 'https://{account}.snowflakecomputing.com/api/v2/statements';

interface SnowflakeQueryResult {
  resultSetMetaData: {
    numRows: number;
    partitionInfo: Array<{ rowCount: number }>;
    rowType: Array<{ name: string; type: string }>;
  };
  data: Array<Array<string | number>>;
}

interface SnowflakeAuthResponse {
  token: string;
  validityInSeconds: number;
}

// Mock data for when Snowflake credentials are not provided
function generateMockHealthMetrics(files: string[]): HealthMetrics[] {
  return files.map((file) => {
    // Generate deterministic but varied metrics based on file path
    const hash = file.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fileChurn = (hash % 50) + 1;
    const bugFrequency = (hash % 20);
    
    let status: 'hot' | 'stable' | 'moderate';
    if (fileChurn > 35 || bugFrequency > 15) {
      status = 'hot';
    } else if (fileChurn < 15 && bugFrequency < 5) {
      status = 'stable';
    } else {
      status = 'moderate';
    }

    return {
      file,
      fileChurn,
      bugFrequency,
      status,
    };
  });
}

async function getSnowflakeToken(env: Env): Promise<string> {
  const accountUrl = `https://${env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
  
  const response = await fetch(`${accountUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: env.SNOWFLAKE_USER,
      password: env.SNOWFLAKE_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Snowflake auth failed: ${response.statusText}`);
  }

  const data = await response.json() as SnowflakeAuthResponse;
  return data.token;
}

async function querySnowflake(
  sql: string,
  env: Env,
  token: string
): Promise<SnowflakeQueryResult> {
  const url = SNOWFLAKE_SQL_API.replace('{account}', env.SNOWFLAKE_ACCOUNT);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Snowflake-Authorization-Token-Type': 'OAUTH',
    },
    body: JSON.stringify({
      statement: sql,
      timeout: 60,
      database: 'GITHUB_ANALYTICS',
      schema: 'PUBLIC',
      warehouse: 'COMPUTE_WH',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Snowflake query error:', errorText);
    throw new Error(`Snowflake query failed: ${response.statusText}`);
  }

  return response.json() as Promise<SnowflakeQueryResult>;
}

export async function getFileHealthMetrics(
  entryPoints: EntryPoint[],
  repoName: string,
  env: Env
): Promise<HealthMetrics[]> {
  const files = entryPoints.map((ep) => ep.file);

  // Check if Snowflake credentials are provided
  if (!env.SNOWFLAKE_ACCOUNT || !env.SNOWFLAKE_USER || !env.SNOWFLAKE_PASSWORD) {
    console.log('Snowflake credentials not provided, using mock data');
    return generateMockHealthMetrics(files);
  }

  try {
    const token = await getSnowflakeToken(env);
    
    // Build SQL query for file metrics
    const fileList = files.map((f) => `'${f.replace(/'/g, "''")}'`).join(', ');
    
    const sql = `
      SELECT 
        file_path,
        COALESCE(file_churn, 0) as file_churn,
        COALESCE(bug_frequency, 0) as bug_frequency
      FROM github_analytics.public.file_metrics
      WHERE repo_name = '${repoName.replace(/'/g, "''")}'
        AND file_path IN (${fileList})
    `;

    const result = await querySnowflake(sql, env, token);
    
    // Map results to HealthMetrics
    const metricsMap = new Map<string, { fileChurn: number; bugFrequency: number }>();
    
    for (const row of result.data) {
      const [filePath, fileChurn, bugFrequency] = row;
      metricsMap.set(filePath as string, {
        fileChurn: Number(fileChurn),
        bugFrequency: Number(bugFrequency),
      });
    }

    return files.map((file) => {
      const metrics = metricsMap.get(file);
      const fileChurn = metrics?.fileChurn ?? 0;
      const bugFrequency = metrics?.bugFrequency ?? 0;
      
      let status: 'hot' | 'stable' | 'moderate';
      if (fileChurn > 35 || bugFrequency > 15) {
        status = 'hot';
      } else if (fileChurn < 15 && bugFrequency < 5) {
        status = 'stable';
      } else {
        status = 'moderate';
      }

      return {
        file,
        fileChurn,
        bugFrequency,
        status,
      };
    });
  } catch (error) {
    console.error('Snowflake query failed, falling back to mock data:', error);
    return generateMockHealthMetrics(files);
  }
}

// Additional utility to get repository-wide metrics
export async function getRepoHealthOverview(
  repoName: string,
  env: Env
): Promise<{
  totalCommits: number;
  activeContributors: number;
  avgFileChurn: number;
}> {
  // Check if Snowflake credentials are provided
  if (!env.SNOWFLAKE_ACCOUNT || !env.SNOWFLAKE_USER || !env.SNOWFLAKE_PASSWORD) {
    // Return mock overview data
    const hash = repoName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      totalCommits: (hash % 1000) + 100,
      activeContributors: (hash % 50) + 5,
      avgFileChurn: (hash % 30) + 5,
    };
  }

  try {
    const token = await getSnowflakeToken(env);
    
    const sql = `
      SELECT 
        COALESCE(SUM(commit_count), 0) as total_commits,
        COALESCE(COUNT(DISTINCT contributor), 0) as active_contributors,
        COALESCE(AVG(file_churn), 0) as avg_file_churn
      FROM github_analytics.public.repo_metrics
      WHERE repo_name = '${repoName.replace(/'/g, "''")}'
    `;

    const result = await querySnowflake(sql, env, token);
    
    if (result.data.length > 0) {
      const [totalCommits, activeContributors, avgFileChurn] = result.data[0];
      return {
        totalCommits: Number(totalCommits),
        activeContributors: Number(activeContributors),
        avgFileChurn: Number(avgFileChurn),
      };
    }

    return { totalCommits: 0, activeContributors: 0, avgFileChurn: 0 };
  } catch {
    // Return mock data on error
    const hash = repoName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      totalCommits: (hash % 1000) + 100,
      activeContributors: (hash % 50) + 5,
      avgFileChurn: (hash % 30) + 5,
    };
  }
}
