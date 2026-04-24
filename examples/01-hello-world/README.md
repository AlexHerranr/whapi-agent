# Example: hello world

The smallest useful agent. Buffered messages, no tools, SQLite state, a terse system prompt.

## Run

```bash
cp .env.example .env
# set ANTHROPIC_API_KEY and WHAPI_TOKEN
npm install
npx tsx index.ts
```

Point your WHAPI channel webhook at `http://<host>:3000/webhook` and send a message. Send three messages quickly — you should get one buffered reply.
