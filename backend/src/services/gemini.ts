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

export async function analyzeWithGemini(
  context: GitHubRepoContext,
  env: Env
): Promise<GeminiAnalysis> {
  const prompt = buildPrompt(context);

  // Current production models (gemini-pro is deprecated)
  const models = [
    { name: 'gemini-2.0-flash-exp', version: 'v1beta' },
    { name: 'gemini-1.5-flash', version: 'v1beta' },
    { name: 'gemini-1.5-flash-latest', version: 'v1beta' },
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent`;
      
      const response = await fetch(`${apiUrl}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: SYSTEM_PROMPT },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error with ${model.name}:`, errorText);
        lastError = `${response.statusText}: ${errorText}`;
        continue; // Try next model
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        error?: { message: string };
      };

      if (data.error) {
        console.error(`Gemini API error with ${model.name}:`, data.error.message);
        lastError = data.error.message;
        continue; // Try next model
      }

      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textContent) {
        lastError = 'No response content from Gemini';
        continue;
      }

      console.log(`✅ Successfully used Gemini model: ${model.name} (${model.version})`);
      return parseGeminiResponse(textContent);
    } catch (error) {
      console.error(`Failed with model ${model.name}:`, error);
      lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  // All models failed
  throw new Error(`Gemini API error (tried all models): ${lastError}`);
}
