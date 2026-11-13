import { analyze } from "@/lib/extract/analyze";
import { normalizeUrl, renderAndCollect } from "@/lib/extract/browser";
import { extractFromImage } from "@/lib/extract/image";
import { buildDesignMd } from "@/lib/generate/designmd";
import { writeProse } from "@/lib/generate/prose";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";
import type { ExtractionResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Body = { url?: string; image?: string; palette?: string[] };

export async function POST(req: Request) {
  const rl = rateLimit(clientIp(req), Number(process.env.RATE_LIMIT_PER_HOUR || 30), 60 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: `Slow down a little. Try again in ${rl.retryAfter}s.` }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.url && !body.image) return Response.json({ error: "Send a url or an image" }, { status: 400 });
  if (body.image && (!body.image.startsWith("data:image/") || body.image.length > 8_000_000)) {
    return Response.json({ error: "Image must be a PNG/JPEG/WebP under ~6MB" }, { status: 400 });
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      const step = (message: string) => send({ type: "step", message });
      try {
        let result: ExtractionResult;
        const id = crypto.randomUUID().slice(0, 8);
        if (body.url) {
          const url = normalizeUrl(body.url);
          step("Launching a headless browser");
          const { raw, screenshot } = await renderAndCollect(url, step);
          step(`Analyzing ${raw.colors.length} colors, ${raw.fonts.length} text styles and ${raw.components.buttons.length} buttons`);
          const tokens = analyze(raw);
          send({ type: "tokens", tokens, screenshot });
          step("Writing the DESIGN.md narrative");
          const { prose, aiUsed } = await writeProse(tokens, screenshot, url);
          result = {
            id, tokens, prose, screenshot, aiUsed, createdAt: Date.now(),
            source: { type: "url", url, title: raw.meta.title, favicon: raw.meta.favicon },
            designMd: buildDesignMd(tokens, prose, url),
          };
        } else {
          step("Reading your screenshot with a vision model");
          const { tokens, prose } = await extractFromImage(body.image!, body.palette || []);
          send({ type: "tokens", tokens });
          step("Assembling DESIGN.md");
          result = {
            id, tokens, prose, aiUsed: true, createdAt: Date.now(),
            source: { type: "image", title: tokens.name },
            designMd: buildDesignMd(tokens, prose),
          };
        }
        step("Done");
        send({ type: "result", data: result });
      } catch (e) {
        const msg = (e as Error).message || "Something went wrong";
        const friendly = /net::ERR_NAME_NOT_RESOLVED/.test(msg) ? "Couldn't find that website. Check the URL." :
          /Timeout|timed out/i.test(msg) ? "The site took too long to load." : msg;
        send({ type: "error", message: friendly });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
