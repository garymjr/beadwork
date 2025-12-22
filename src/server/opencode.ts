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
  return opencodeInstance;
};
