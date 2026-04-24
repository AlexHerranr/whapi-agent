# Deployment

The runtime is a single Node 20 process with a single SQLite file. Any host that can run Node can host it.

## Docker Compose (default)

```bash
cp .env.example .env
docker compose up -d
docker compose logs -f
```

The image is multi-stage (build → slim runtime), runs as `node` (non-root), and exposes `/health` for orchestrator probes.

## Railway

```bash
railway link
railway up
```

Add the environment variables from `.env.example` in the Railway dashboard. Persist `/app/data` via a Railway volume if you want the SQLite store to survive redeploys.

## Fly.io

```bash
fly launch --no-deploy
fly secrets set ANTHROPIC_API_KEY=... WHAPI_TOKEN=...
fly volumes create whapi_data --size 1
# mount at /app/data in fly.toml
fly deploy
```

## Bare VPS with systemd

```ini
# /etc/systemd/system/whapi-agent.service
[Unit]
Description=whapi-agent
After=network.target

[Service]
Type=simple
User=whapi
WorkingDirectory=/opt/whapi-agent
EnvironmentFile=/opt/whapi-agent/.env
ExecStart=/usr/bin/node /opt/whapi-agent/dist/main.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now whapi-agent
sudo journalctl -u whapi-agent -f
```

## Webhook URL

WHAPI.cloud requires an HTTPS webhook. In development a tunnel (ngrok, cloudflared, tailscale funnel) is enough. In production point a subdomain at the host and put a reverse proxy (Caddy or nginx) in front.

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":1234,"version":"0.1.0"}
```

Return codes:

- `200` — ready to receive traffic.
- `503` — database unavailable or required env var missing.

## Backups

The only stateful artifact is `data/whapi-agent.sqlite`. Daily `cp` plus off-host upload (S3, Backblaze) is sufficient for most deployments.
