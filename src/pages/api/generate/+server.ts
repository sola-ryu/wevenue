import type { APIRoute } from 'astro';

// Prompt template for site generation
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

export const POST: APIRoute = async ({ request, platform }) => {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "prompt" field' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get Open WebUI URL and optional API key from env
    const openwebuiUrl = import.meta.env.OPENWEBUI_URL || 'https://chat.xusix.com';
    const apiKey = import.meta.env.OPENWEBUI_API_KEY;

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Call the local LLM via the tunnel
    const response = await fetch(`${openwebuiUrl}/api/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: '',  // Empty = use default model
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        stream: false,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Open WebUI error: ${response.status} ${text.slice(0, 500)}`);
      return new Response(JSON.stringify({ error: `AI service unavailable (${response.status})` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await response.json();

    // Extract the assistant's message content
    const content = data?.choices?.[0]?.message?.content || data?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty response from AI' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // Parse JSON from the response (strip markdown fences if present)
    let parsed: { title?: string; html?: string; css?: string; js?: string };
    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // If it's not valid JSON, wrap the raw text as HTML
      console.warn('AI response was not valid JSON, wrapping as-is');
      parsed = {
        title: 'Generated Site',
        html: `<pre class="p-8 text-gray-300 font-mono whitespace-pre-wrap">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
        css: '',
        js: '',
      };
    }

    // Store in D1 if available (track sessions)
    if (platform?.DB) {
      try {
        await platform.DB.prepare(
          'INSERT INTO sessions (prompt) VALUES (?)'
        ).run(prompt);
      } catch (dbErr) {
        // D1 may not be configured yet — non-critical
        console.warn('D1 write failed:', dbErr);
      }
    }

    return new Response(JSON.stringify({
      title: parsed.title || 'Generated Site',
      html: parsed.html || '',
      css: parsed.css || '',
      js: parsed.js || '',
      code: parsed.html ? `<!-- ${parsed.title} -->\n${parsed.html}` : content,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Generate error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
