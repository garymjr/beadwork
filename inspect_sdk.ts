import { createOpencode } from '@opencode-ai/sdk';

(async () => {
  try {
    const { client } = await createOpencode({ config: { model: 'opencode/big-pickle' } });
    const sessionResponse = await client.session.create({});
    const sessionId = sessionResponse.data.id;

    console.log('Prompting session:', sessionId);
    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        parts: [{ type: 'text', text: 'Say "hello"' }]
      }
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
