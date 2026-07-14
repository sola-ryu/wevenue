# Wevenue — AI Agent Website Builder

Describe your site. Your agent builds it.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Astro (static) + Cloudflare Workers adapter | Marketing pages + API routes |
| AI Backend | Open WebUI tunnel (`chat.xusix.com`) | LLM inference |
| Storage | Cloudflare D1 (SQLite) | Session tracking, waitlist |
| Assets | Cloudflare R2 | Generated site storage |
| Hosting | Cloudflare Pages (static) + Workers (API) | Edge deployment |

## Quick Start

```bash
# Install dependencies
npm install

# Run locally (marketing pages + API route via Astro dev server)
npm run dev
```

The dev server runs on `http://localhost:4321`. The `/api/generate` route calls your local Open WebUI at `chat.xusix.com`.

## Cloudflare Setup

### 1. Create D1 database
```bash
npx wrangler d1 create wevenue-db
# Copy the database_id into wrangler.toml
```

### 2. Create R2 bucket
```bash
npx wrangler r2 bucket create wevenue-assets
```

### 3. Set environment variables
In the Cloudflare dashboard (or via `wrangler secret put`):
- `OPENWEBUI_URL` — your Open WebUI tunnel URL (e.g., `https://chat.xusix.com`)
- If your Open WebUI requires auth: `OPENWEBUI_API_KEY`

### 4. Deploy
```bash
npx wrangler pages deploy dist
```

This publishes the static site to Cloudflare Pages and registers the Workers API route.

## Architecture

```
User → Cloudflare Pages (static marketing) 
       ↘ Cloudflare Workers (/api/generate)
            ↘ chat.xusix.com (your Mac Studio / Open WebUI)
                 ↘ Local LLM (via cloudflared tunnel)
```

The marketing site is pure static HTML served from edge caches. The `/api/generate` route runs on a Cloudflare Worker, proxies the prompt to your local LLM via the Cloudflare Tunnel, and returns the generated code as JSON.

## Development Notes

- Marketing pages are ported from `wevenue-site/` (the parody version)
- The generate API expects Open WebUI's `/api/v1/chat/completions` format
- If your Open WebUI has authentication, add the Bearer token in `+server.ts`
- D1 schema: `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`

## Future Work

- [ ] Multi-agent orchestration (separate prompts for Pixel/Semicolon/Bugger)
- [ ] Site preview iframe in the app shell
- [ ] Download as ZIP functionality
- [ ] Waitlist / email capture
- [ ] User accounts (Cloudflare Workers Auth)
- [ ] R2 storage for generated sites
- [ ] Streaming response for real-time feedback
