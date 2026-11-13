import { chatStream, CODE_MODEL, type Msg } from "@/lib/ai";
import { cleanHtml } from "@/lib/clone/jobs";
import { EDIT_PAGE_SYSTEM, EDIT_SECTION_SYSTEM } from "@/lib/clone/prompts";
import { one, q } from "@/lib/server/db";
import { apiUser, latestHtml, ownedProject } from "@/lib/server/projects";
import { rateLimit } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function findSection(html: string, name: string) {
  const re = new RegExp(`<(header|section|footer|nav|div|main)\\b[^>]*data-section=["']${name.replace(/[^\w-]/g, "")}["'][^>]*>`, "i");
  const m = re.exec(html);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  // walk forward balancing same-name tags
  const open = new RegExp(`<${tag}\\b`, "gi"), close = new RegExp(`</${tag}>`, "gi");
  let depth = 0;
  const i = m.index;
  const tokens: { pos: number; open: boolean; len: number }[] = [];
  open.lastIndex = i; close.lastIndex = i;
  let mm;
  while ((mm = open.exec(html))) tokens.push({ pos: mm.index, open: true, len: 0 });
  while ((mm = close.exec(html))) tokens.push({ pos: mm.index, open: false, len: mm[0].length });
  tokens.sort((a, b) => a.pos - b.pos);
  for (const t of tokens) {
    depth += t.open ? 1 : -1;
    if (depth === 0) return { start: i, end: t.pos + t.len };
  }
  return null;
}

/**
 * Chat edit. Streams the AI output as text; the final line protocol is:
 *   the raw HTML stream, then "\n<<<DD_DONE:{json}>>>" with the saved version id and full html.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  if (!rateLimit("edit:" + u.id, Number(process.env.EDITS_PER_HOUR || 60), 3600_000).ok) return Response.json({ error: "Too many edits this hour, take a short break." }, { status: 429 });

  const { pageId, message, section } = await req.json().catch(() => ({}));
  if (!message || typeof message !== "string" || message.length > 4000) return Response.json({ error: "Type what you'd like to change" }, { status: 400 });
  const page = await one<{ id: string }>("select id from pages where id = $1 and project_id = $2", [pageId, p.id]);
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });
  const current = await latestHtml(page.id);
  if (!current) return Response.json({ error: "This page hasn't finished cloning yet" }, { status: 409 });

  const range = section ? findSection(current, section) : null;
  const head = current.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "";
  const brand = p.design_md ? `\n\nDesign system for reference (keep consistent unless asked to change):\n${p.design_md.slice(0, 6000)}` : "";
  const messages: Msg[] = range
    ? [{ role: "system", content: EDIT_SECTION_SYSTEM }, { role: "user", content: `<head> for context:\n${head.slice(0, 8000)}\n\nSection to edit:\n${current.slice(range.start, range.end)}\n\nChange requested: ${message}` }]
    : [{ role: "system", content: EDIT_PAGE_SYSTEM + brand }, { role: "user", content: `Current page:\n${current}\n\nChange requested: ${message}` }];

  await q("insert into messages (project_id, page_id, role, content) values ($1, $2, 'user', $3)", [p.id, page.id, section ? `[${section}] ${message}` : message]);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let acc = "";
      try {
        for await (const chunk of chatStream(messages, { model: CODE_MODEL, maxTokens: 30000 })) {
          acc += chunk;
          controller.enqueue(enc.encode(chunk));
        }
        let html: string;
        if (range) {
          const frag = acc.trim().replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
          html = current.slice(0, range.start) + frag + current.slice(range.end);
        } else {
          html = cleanHtml(acc);
        }
        if (!/<\/(html|body)>/i.test(html)) throw new Error("The edit came back incomplete. Try again or make the request smaller.");
        const v = await one<{ id: string }>("insert into versions (page_id, html, prompt) values ($1, $2, $3) returning id", [page.id, html, message.slice(0, 300)]);
        const reply = range ? `Updated the ${section} section.` : "Done. The page is updated.";
        await q("insert into messages (project_id, page_id, role, content) values ($1, $2, 'assistant', $3)", [p.id, page.id, reply]);
        await q("update projects set updated_at = now() where id = $1", [p.id]);
        controller.enqueue(enc.encode(`\n<<<DD_DONE:${JSON.stringify({ versionId: v!.id, html, reply })}>>>`));
      } catch (e) {
        controller.enqueue(enc.encode(`\n<<<DD_ERROR:${JSON.stringify({ error: (e as Error).message })}>>>`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
