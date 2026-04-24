# Example: with tools

An agent that can call two tools: `get_weather` (using Open-Meteo, no API key) and a custom `search_docs` over a small FAQ.

## Run

```bash
cp .env.example .env
# set ANTHROPIC_API_KEY and WHAPI_TOKEN
npm install
npx tsx index.ts
```

Try:

- *"What's the weather in Barcelona?"* → hits `get_weather`.
- *"What are your opening hours?"* → hits `search_docs`.
