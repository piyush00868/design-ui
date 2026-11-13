import { one, q } from "@/lib/server/db";
import { apiUser, ownedProject } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

async function ownedPage(projectId: string, pageId: string | null) {
  if (!pageId || !/^[0-9a-f-]{36}$/i.test(pageId)) return null;
  return one<{ id: string }>("select id from pages where id = $1 and project_id = $2", [pageId, projectId]);
}

/** ?page=<id> → list versions; ?page=<id>&v=<versionId> → one version's html */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const page = await ownedPage(p.id, sp.get("page"));
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });
  const v = sp.get("v");
  if (v) {
    const row = await one<{ id: string; html: string; prompt: string; created_at: string }>("select id, html, prompt, created_at from versions where id = $1 and page_id = $2", [v, page.id]);
    return row ? Response.json(row) : Response.json({ error: "Not found" }, { status: 404 });
  }
  const list = await q("select id, prompt, created_at from versions where page_id = $1 order by created_at desc limit 50", [page.id]);
  const latest = await one<{ id: string; html: string }>("select id, html from versions where page_id = $1 order by created_at desc limit 1", [page.id]);
  return Response.json({ versions: list, latest });
}

/** Restore an older version (copies it to a new latest version). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const { pageId, versionId } = await req.json().catch(() => ({}));
  const page = await ownedPage(p.id, pageId);
  if (!page) return Response.json({ error: "Page not found" }, { status: 404 });
  const src = await one<{ html: string; created_at: string }>("select html, created_at from versions where id = $1 and page_id = $2", [versionId, page.id]);
  if (!src) return Response.json({ error: "Version not found" }, { status: 404 });
  const v = await one<{ id: string }>("insert into versions (page_id, html, prompt) values ($1, $2, $3) returning id", [page.id, src.html, `Restored version from ${new Date(src.created_at).toLocaleString()}`]);
  await q("update projects set updated_at = now() where id = $1", [p.id]);
  return Response.json({ id: v!.id, html: src.html });
}
