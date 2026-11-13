import { startPageClone } from "@/lib/clone/jobs";
import { normalizeUrl } from "@/lib/extract/browser";
import { one } from "@/lib/server/db";
import { apiUser, latestHtml, ownedProject } from "@/lib/server/projects";
import { rateLimit } from "@/lib/server/ratelimit";

export const dynamic = "force-dynamic";

/** Clone another page of the same site into this project. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  if (!p.source_url) return Response.json({ error: "Multi-page cloning needs a URL project" }, { status: 400 });
  if (!rateLimit("clone:" + u.id, Number(process.env.CLONES_PER_DAY || 25), 24 * 3600_000).ok) return Response.json({ error: "Daily clone limit reached" }, { status: 429 });
  const { url, label } = await req.json().catch(() => ({}));
  let target: URL;
  try { target = new URL(normalizeUrl(String(url))); } catch { return Response.json({ error: "Invalid URL" }, { status: 400 }); }
  if (target.hostname !== new URL(p.source_url).hostname) return Response.json({ error: "Pages must be on the same site" }, { status: 400 });
  const path = target.pathname.replace(/\/$/, "") || "/";
  const existing = await one<{ id: string }>("select id from pages where project_id = $1 and path = $2", [p.id, path]);
  if (existing) return Response.json({ error: "That page is already in this project", pageId: existing.id }, { status: 409 });
  const page = (await one<{ id: string }>("insert into pages (project_id, path, title, source_url) values ($1, $2, $3, $4) returning id",
    [p.id, path, String(label || path).slice(0, 60), target.toString()]))!;
  const home = await one<{ id: string }>("select id from pages where project_id = $1 and path = '/'", [p.id]);
  startPageClone(p.id, page.id, target.toString(), home ? await latestHtml(home.id) : null, p.design_md || "");
  return Response.json({ pageId: page.id });
}
