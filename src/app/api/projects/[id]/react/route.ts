import { chatStream, CODE_MODEL } from "@/lib/ai";
import { REACT_SYSTEM } from "@/lib/clone/prompts";
import { one } from "@/lib/server/db";
import { apiUser, latestHtml, ownedProject } from "@/lib/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const { pageId } = await req.json().catch(() => ({}));
  const page = await one<{ id: string }>("select id from pages where id = $1 and project_id = $2", [pageId, p.id]);
  const html = page ? await latestHtml(page.id) : null;
  if (!html) return Response.json({ error: "Nothing to convert yet" }, { status: 404 });
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      try {
        for await (const chunk of chatStream([{ role: "system", content: REACT_SYSTEM }, { role: "user", content: html }], { model: CODE_MODEL, maxTokens: 30000 })) c.enqueue(enc.encode(chunk));
      } catch (e) { c.enqueue(enc.encode(`\n// error: ${(e as Error).message}`)); }
      c.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
