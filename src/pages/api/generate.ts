import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const SYSTEM_PROMPT = `You are a website builder agent. Given a user's description, generate a complete, production-ready single-page website.

Output format — return ONLY valid JSON with this structure:
{
  "title": "Page title",
  "html": "<!DOCTYPE html>...complete HTML document...",
  "css": "/* CSS styles */",
  "js": "// JavaScript if needed"
}

Requirements:
- Modern, clean design with Tailwind-like utility classes (but use inline <style> with custom CSS)
- Fully responsive (mobile-first)
- Dark theme by default unless the user requests otherwise
- Semantic HTML5 structure
- Include a nav, hero section, content sections, and footer
- Use CSS gradients, subtle animations, and good typography
- No external dependencies — all CSS/JS inline
- Real, polished output — not placeholder lorem ipsum

Return ONLY the JSON object. No markdown fences. No explanation.`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "prompt" field' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const openwebuiUrl = env.OPENWEBUI_URL || import.meta.env.OPENWEBUI_URL || 'https://chat.xusix.com';
    const apiKey = env.OPENWEBUI_API_KEY;
    const model = env.OPENWEBUI_MODEL || 'qwen/qwen3.6-35b-a3b';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${openwebuiUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Open WebUI error: ${response.status} ${text.slice(0, 500)}`);
      return new Response(JSON.stringify({ error: `AI service unavailable (${response.status})` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    if (env?.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO sessions (prompt) VALUES (?)'
        ).run(prompt);
      } catch (dbErr) {
        console.warn('D1 write failed:', dbErr);
      }
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Generate error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
