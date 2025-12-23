import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';

(async () => {
  try {
    const { session } = await createAgentSession({
      sessionManager: SessionManager.inMemory(),
    });

    console.log('Session ID:', session.sessionId);

    session.subscribe((event) => {
      if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      
      if (event.type === 'agent_end') {
        console.log('\n\nDone!');
        process.exit(0);
      }
    });

    await session.prompt('Say "hello"');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
