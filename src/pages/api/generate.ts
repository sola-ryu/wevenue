import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const SYSTEM_PROMPT = `You are a website builder agent. Given a user's description, generate a complete, production-ready single-page website. Return the result as JSON matching the provided schema.`;

const SITE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'site_response',
    strict: 'true',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        html: { type: 'string' },
        css: { type: 'string' },
        js: { type: 'string' },
      },
      required: ['title', 'html', 'css', 'js'],
    },
  },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "prompt" field' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const lmstudioUrl = env.LMSTUDIO_URL;
    const lmstudioModel = env.LMSTUDIO_MODEL;

    const baseUrl = lmstudioUrl || env.OPENWEBUI_URL || import.meta.env.OPENWEBUI_URL || 'https://chat.xusix.com';
    const model = lmstudioModel || env.OPENWEBUI_MODEL || 'qwen/qwen3.6-35b-a3b';
    const apiKey = env.OPENWEBUI_API_KEY;
    const useLmstudio = !!lmstudioUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (!useLmstudio && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const endpoint = useLmstudio ? `${baseUrl}/v1/chat/completions` : `${baseUrl}/api/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: SITE_SCHEMA,
        stream: true,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`LLM error: ${response.status} ${text.slice(0, 500)}`);
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
