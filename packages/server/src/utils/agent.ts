import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';

// Singleton session to prevent spawning multiple sessions
let sessionInstance: Awaited<ReturnType<typeof createAgentSession>>['session'] | null = null;
let isInitializing = false;
let initPromise: Promise<Awaited<ReturnType<typeof createAgentSession>>['session']> | null = null;

export const getAgent = async (projectPath?: string) => {
  if (sessionInstance) {
    return sessionInstance;
  }
  
  if (isInitializing && initPromise) {
    // Another request is initializing, wait for it
    sessionInstance = await initPromise;
    return sessionInstance;
  }
  
  isInitializing = true;
  initPromise = (async () => {
    const { session } = await createAgentSession({
      cwd: projectPath || process.cwd(),
      sessionManager: SessionManager.inMemory(),
      thinkingLevel: "off",
      // Use default model discovery
    });
    return session;
  })();
  
  try {
    sessionInstance = await initPromise;
    console.log('pi-mono agent session initialized.');
    return sessionInstance;
  } catch (error) {
    console.error('Failed to create agent session:', error);
    throw new Error(`Agent initialization failed: ${error}`);
  } finally {
    isInitializing = false;
    initPromise = null;
  }
};

export const generateTitle = async (description: string, projectPath?: string): Promise<string> => {
  const session = await getAgent(projectPath);
  
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    
    const unsubscribe = session.subscribe((event) => {
      if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
        fullResponse += event.assistantMessageEvent.delta;
      }
      
      if (event.type === 'agent_end') {
        unsubscribe();
        // Clean up the response
        let title = fullResponse.trim();
        
        // Remove quotes if present
        if (title.startsWith('"') && title.endsWith('"')) {
          title = title.slice(1, -1);
        }
        
        // Remove markdown code blocks if present
        title = title.replace(/^```\w*\n?|\n?```$/g, '').trim();
        
        resolve(title || 'Untitled Issue');
      }
      
      if (event.type === 'message_end' && (event.message as any)?.error) {
        unsubscribe();
        reject(new Error('Agent error'));
      }
    });
    
    const prompt = `Generate a short, concise software issue title (max 50 chars) for the following description. Return ONLY the title text, no quotes, no preambles: 

${description}`;
    
    session.prompt(prompt).catch((err) => {
      unsubscribe();
      reject(err);
    });
  });
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
  const session = await getAgent(projectPath);
  
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    
    const unsubscribe = session.subscribe((event) => {
      if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
        fullResponse += event.assistantMessageEvent.delta;
      }
      
      if (event.type === 'agent_end') {
        unsubscribe();

        // Debug logging
        console.error('[agent] Full response received:', fullResponse.substring(0, 500) + (fullResponse.length > 500 ? '...' : ''));

        try {
          // Try to find JSON in the response if there's markdown around it
          // Use a more precise regex that matches balanced braces
          const jsonMatch = fullResponse.match(/\{[\s\S]*?"plan"[\s\S]*?"subtasks"[\s\S]*?\[[\s\S]*\][\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : fullResponse;

          console.error('[agent] Extracted JSON:', jsonStr.substring(0, 200) + '...');

          const result = JSON.parse(jsonStr) as PlanResult;
          resolve(result);
        } catch (e) {
          console.error('[agent] Parse error details:', e);
          console.error('[agent] Response that failed:', fullResponse);
          reject(new Error(`Failed to parse plan JSON: ${e}. Response may not contain valid JSON.`));
        }
      }
      
      if (event.type === 'message_end' && (event.message as any)?.error) {
        unsubscribe();
        reject(new Error('Agent error'));
      }
    });
    
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
    
    session.prompt(prompt).catch((err) => {
      unsubscribe();
      reject(err);
    });
  });
};
