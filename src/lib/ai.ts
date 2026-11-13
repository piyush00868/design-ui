// Minimal OpenAI-compatible client (works with OpenAI, OpenRouter, Groq, etc.
// via OPENAI_BASE_URL). Everything AI-powered degrades gracefully without a key.

const BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export const aiEnabled = () => Boolean(process.env.OPENAI_API_KEY);
export const FAST_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const CODE_MODEL = process.env.OPENAI_CODE_MODEL || "gpt-4.1";

type Content = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } })[];
export type Msg = { role: "system" | "user" | "assistant"; content: Content };

export async function chatJSON<T>(messages: Msg[], opts: { model?: string; maxTokens?: number } = {}): Promise<T> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: opts.model || FAST_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: opts.maxTokens ?? 3000,
    }),
  });
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as T;
}

/** Streams plain text tokens from a chat completion. */
export async function* chatStream(messages: Msg[], opts: { model?: string; maxTokens?: number } = {}): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: opts.model || CODE_MODEL, messages, stream: true, temperature: 0.3, max_tokens: opts.maxTokens ?? 8000 }),
  });
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const payload = l.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {}
    }
  }
}
