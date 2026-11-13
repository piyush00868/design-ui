import { aiEnabled, chatStream, type Msg } from "@/lib/ai";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const SYSTEM = `You are an elite front-end engineer. Recreate the website's look as a single, self-contained HTML file.
Rules:
- Output ONLY the HTML document, starting with <!DOCTYPE html>. No markdown fences, no commentary.
- Use Tailwind via <script src="https://cdn.tailwindcss.com"></script> and configure tailwind.config with the design tokens (colors, fontFamily, borderRadius, boxShadow).
- Load fonts from Google Fonts when available; if a font is proprietary, use the closest Google Font and keep the original name first in the stack.
- Match the screenshot's layout: navigation, hero, sections, cards, footer. Use the DESIGN.md tokens exactly (hex values, sizes, radii, spacing).
- Use realistic placeholder copy in the same tone (no lorem ipsum). Use https://placehold.co for images if needed, or CSS shapes/gradients.
- Fully responsive, semantic, accessible. No external JS besides Tailwind.`;

export async function POST(req: Request) {
  if (!aiEnabled()) return new Response("Code recreation needs an AI key (OPENAI_API_KEY).", { status: 501 });
  const rl = rateLimit("recreate:" + clientIp(req), Number(process.env.RECREATE_LIMIT_PER_HOUR || 10), 60 * 60 * 1000);
  if (!rl.ok) return new Response(`Rate limited. Try again in ${rl.retryAfter}s.`, { status: 429 });

  const { designMd, screenshot } = (await req.json()) as { designMd: string; screenshot?: string };
  if (!designMd || designMd.length > 60000) return new Response("Missing DESIGN.md", { status: 400 });

  const content: Msg["content"] = [{ type: "text", text: `DESIGN.md:\n\n${designMd}\n\nRecreate the page shown in the screenshot (or, if none, a representative landing page) using this design system.` }];
  if (screenshot) content.push({ type: "image_url", image_url: { url: screenshot, detail: "high" } });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatStream([{ role: "system", content: SYSTEM }, { role: "user", content }])) controller.enqueue(enc.encode(chunk));
      } catch (e) {
        controller.enqueue(enc.encode(`\n<!-- error: ${(e as Error).message} -->`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
