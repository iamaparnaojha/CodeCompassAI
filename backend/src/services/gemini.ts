import type { Env, GitHubRepoContext, GeminiAnalysis } from '../types/index.js';

const SYSTEM_PROMPT = `You are a Senior Open Source Maintainer with deep expertise in code architecture and onboarding new contributors.

Analyze the provided README and file structure. Output a JSON object containing:

1) techStack: An array of technologies, frameworks, and languages used in the project (inferred from file extensions, package files, and README content).

2) architectureSummary: A concise 2-sentence summary of the project's architecture and purpose.

3) dataFlow: A description of how data moves through the application, from entry points to storage/output.

4) entryPoints: An array of exactly 3 specific files/tasks suitable for a first-time contributor. Each entry point should have:
   - file: The path to the file
   - description: Why this is a good starting point and what could be improved
   - difficulty: One of "beginner", "intermediate", or "advanced"

Focus on identifying:
- Good first issues (documentation improvements, small bug fixes, test additions)
- Files that are well-documented and self-contained
- Areas where new contributors can make meaningful impact

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanations outside the JSON.`;

function buildPrompt(context: GitHubRepoContext): string {
  const fileTreeStr = context.fileTree
    .map((f) => `${f.type === 'dir' ? '📁' : '📄'} ${f.path}`)
    .join('\n');

  return `Analyze this GitHub repository:

## Repository: ${context.owner}/${context.repoName}

## README Content:
${context.readme.slice(0, 8000)}

## File Structure:
${fileTreeStr}

Provide your analysis as a JSON object.`;
}

function parseGeminiResponse(text: string): GeminiAnalysis {
  // Try to extract JSON from the response
  let jsonStr = text.trim();
  
  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!parsed.techStack || !Array.isArray(parsed.techStack)) {
      parsed.techStack = ['Unknown'];
    }
    if (!parsed.architectureSummary || typeof parsed.architectureSummary !== 'string') {
      parsed.architectureSummary = 'Architecture analysis not available.';
    }
    if (!parsed.dataFlow || typeof parsed.dataFlow !== 'string') {
      parsed.dataFlow = 'Data flow analysis not available.';
    }
    if (!parsed.entryPoints || !Array.isArray(parsed.entryPoints)) {
      parsed.entryPoints = [];
    }

    // Ensure entry points have required fields
    parsed.entryPoints = parsed.entryPoints.map((ep: Record<string, unknown>) => ({
      file: ep.file || 'Unknown file',
      description: ep.description || 'No description available',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(ep.difficulty as string)
        ? ep.difficulty
        : 'intermediate',
    }));

    return parsed as GeminiAnalysis;
  } catch {
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

let cachedGeminiModel: string | null = null;

export async function analyzeWithGemini(
  context: GitHubRepoContext,
  env: Env
): Promise<GeminiAnalysis> {
  const prompt = buildPrompt(context);

  async function listModels(): Promise<Array<{ name: string; supportedMethods?: string[] }>> {
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(listUrl, { method: 'GET' });
      if (!res.ok) {
        const body = await res.text();
        console.error('Failed to list Gemini models:', res.status, body);
        return [];
      }
      const body = await res.json() as { models?: Array<{ name?: string; supportedMethods?: string[] }> };
      return (body.models || []).map((m) => ({ name: m.name || '', supportedMethods: m.supportedMethods }));
    } catch (e) {
      console.error('Error calling ListModels:', e);
      return [];
    }
  }

  async function getGeminiModel(): Promise<string> {
    if (env.GEMINI_MODEL?.trim()) {
      console.log(`Using Gemini model override from env: ${env.GEMINI_MODEL}`);
      return env.GEMINI_MODEL.trim();
    }

    if (cachedGeminiModel) {
      return cachedGeminiModel;
    }

    const available = await listModels();
    if (!available.length) {
      throw new Error('Could not discover any Gemini models from ListModels. Check your GEMINI_API_KEY and network.');
    }

    const candidates = available.filter((m) => (m.supportedMethods || []).includes('generateContent'));
    if (!candidates.length) {
      candidates.push(...available.filter((m) => /flash|gemini|2\.5|2\.0|1\.5/.test(m.name.toLowerCase())));
    }

    if (!candidates.length) {
      throw new Error('No usable Gemini models found from ListModels. Please verify your API key permissions.');
    }

    cachedGeminiModel = candidates[0].name;
    console.log(`Discovered Gemini model: ${cachedGeminiModel}`);
    return cachedGeminiModel;
  }

  async function callGeminiModel(modelName: string) {
    const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1/${modelPath}:generateContent`;
    const res = await fetch(`${apiUrl}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [ { role: 'user', parts: [{ text: SYSTEM_PROMPT }, { text: prompt }] } ],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 },
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text();
      throw new Error(`Model ${modelName} returned ${res.status} ${res.statusText}: ${bodyText}`);
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message: string };
    };

    if (data.error) {
      throw new Error(data.error.message);
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error(`Model ${modelName} returned empty content`);
    }

    return textContent;
  }

  const modelName = await getGeminiModel();
  try {
    const textContent = await callGeminiModel(modelName);
    console.log(`✅ Successfully used Gemini model: ${modelName}`);
    return parseGeminiResponse(textContent);
  } catch (e) {
    if (cachedGeminiModel) {
      console.warn(`Cached Gemini model ${cachedGeminiModel} failed; clearing cache and re-discovering.`);
      cachedGeminiModel = null;
      const modelNameRetry = await getGeminiModel();
      const textContent = await callGeminiModel(modelNameRetry);
      console.log(`✅ Successfully used Gemini model after retry: ${modelNameRetry}`);
      return parseGeminiResponse(textContent);
    }
    throw e;
  }
}
