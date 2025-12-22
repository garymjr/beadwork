import { createOpencode } from '@opencode-ai/sdk';

// Singleton instance to prevent spawning multiple servers
let opencodeInstance: Awaited<ReturnType<typeof createOpencode>> | null = null;

export const getOpencode = async () => {
  if (!opencodeInstance) {
    // createOpencode() starts the server and returns the client
    opencodeInstance = await createOpencode({
      config: {
        model: 'opencode/big-pickle',
      },
    });
    console.log('OpenCode server started with opencode/big-pickle and client initialized.');
  }
  return opencodeInstance.client;
};

export const generateTitle = async (description: string): Promise<string> => {
  const client = await getOpencode();
  try {
    const sessionResponse = await client.session.create({});
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
