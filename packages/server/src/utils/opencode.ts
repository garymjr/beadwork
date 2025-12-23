import { createOpencode } from '@opencode-ai/sdk';

// Singleton instance to prevent spawning multiple servers
let opencodeInstance: Awaited<ReturnType<typeof createOpencode>> | null = null;
let isInitializing = false;
let initPromise: Promise<Awaited<ReturnType<typeof createOpencode>>> | null = null;

export const getOpencode = async () => {
  if (opencodeInstance) {
    return opencodeInstance.client;
  }
  
  if (isInitializing && initPromise) {
    // Another request is initializing, wait for it
    opencodeInstance = await initPromise;
    return opencodeInstance.client;
  }
  
  isInitializing = true;
  initPromise = createOpencode({
    config: {
      model: 'opencode/big-pickle',
    },
  });
  
  try {
    opencodeInstance = await initPromise;
    console.log('OpenCode server started with opencode/big-pickle and client initialized.');
    return opencodeInstance.client;
  } catch (error) {
    console.error('Failed to create OpenCode instance:', error);
    throw new Error(`OpenCode initialization failed: ${error}`);
  } finally {
    isInitializing = false;
    initPromise = null;
  }
};

export const generateTitle = async (description: string, projectPath?: string): Promise<string> => {
  const client = await getOpencode();
  try {
    const sessionResponse = await client.session.create({
      query: { directory: projectPath }
    });
    const sessionId = sessionResponse.data?.id;

    if (!sessionId) {
      console.error("Failed to create OpenCode session");
      return "Untitled Issue";
    }

    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        parts: [{
          type: 'text', text: `Generate a short, concise software issue title (max 50 chars) for the following description. Return ONLY the title text, no quotes, no preambles: 

${description}`
        }]
      }
    });

    const textPart = (result.data as any).parts?.find((p: any) => p.type === 'text');
    let title = textPart?.text?.trim();

    // Cleanup if it returns quotes
    if (title && title.startsWith('"') && title.endsWith('"')) {
      title = title.slice(1, -1);
    }

    return title || "Untitled Issue";

  } catch (e) {
    console.error("Error generating title:", e);
    return "Untitled Issue";
  }
};

export interface PlanResult {
  plan: string;
  subtasks: {
    title: string;
    description: string;
    type: string;
  }[];
}

export const createPlanAction = async (
  title: string, 
  description: string, 
  type: string, 
  projectPath: string
): Promise<PlanResult> => {
  const client = await getOpencode();
  try {
    const sessionResponse = await client.session.create({
      query: { directory: projectPath }
    });
    const sessionId = sessionResponse.data?.id;

    if (!sessionId) {
      throw new Error("Failed to create OpenCode session");
    }

    const prompt = `I am working on the following issue:
Title: ${title}
Description: ${description}
Type: ${type}

Please analyze the project files and create a detailed plan to resolve this issue.
Provide your response in valid JSON format ONLY, with the following structure:
{
  "plan": "Detailed markdown plan...",
  "subtasks": [
    { "title": "Subtask title", "description": "Subtask description", "type": "task" },
    ...
  ]
}
Return only the JSON object, no other text.`;

    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        parts: [{ type: 'text', text: prompt }]
      }
    });

    const textPart = (result.data as any).parts?.find((p: any) => p.type === 'text');
    const text = textPart?.text?.trim();
    
    if (!text) throw new Error("No response from OpenCode");

    // Try to find JSON in the response if there's markdown around it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(jsonStr) as PlanResult;

  } catch (e) {
    console.error("Error creating plan:", e);
    throw e;
  }
};
