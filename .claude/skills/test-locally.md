---
name: test-locally
description: Run the agent on your machine against a real WhatsApp channel using a public tunnel.
---

# Running locally with a public tunnel

WHAPI needs an HTTPS URL it can reach. In development, a tunnel is the simplest path.

## Option A — cloudflared (recommended, free, stable URL)

```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the `https://...trycloudflare.com` URL and set it as the webhook URL in the WHAPI dashboard (append `/webhook`).

## Option B — ngrok (free tier has rotating URLs)

```bash
ngrok http 3000
```

Same idea: copy the `https://...ngrok-free.app` URL, add `/webhook`.

## Option C — Tailscale Funnel (if you already use Tailscale)

```bash
tailscale funnel 3000
```

## Run the agent

```bash
npm install
cp .env.example .env
# fill ANTHROPIC_API_KEY and WHAPI_TOKEN
npm run dev
```

Send a WhatsApp message to the number linked to your WHAPI channel. You should see the webhook log line appear and a reply arrive within a few seconds.

## Reset local state

The SQLite file holds conversation history:

```bash
rm -f ./data/whapi-agent.sqlite
```

Deleting it is safe — a fresh file is created on next start.
