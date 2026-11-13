import { startProjectClone } from "@/lib/clone/jobs";
import { normalizeUrl } from "@/lib/extract/browser";
import { one, q } from "@/lib/server/db";
import { apiUser } from "@/lib/server/projects";
import { rateLimit } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await apiUser(); if (u instanceof Response) return u;
  const rows = await q(
    `select id, name, source_type, source_url, favicon, thumbnail, status, updated_at, (select count(*)::int from pages where project_id = projects.id) as page_count
     from projects where user_id = $1 order by updated_at desc limit 100`, [u.id]);
  return Response.json({ projects: rows });
}

export async function POST(req: Request) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const rl = rateLimit("clone:" + u.id, Number(process.env.CLONES_PER_DAY || 25), 24 * 3600_000);
  if (!rl.ok) return Response.json({ error: "You've hit today's clone limit. Try again tomorrow." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  let url: string | undefined;
  if (body.url) {
    try { url = normalizeUrl(String(body.url)); } catch (e) { return Response.json({ error: (e as Error).message }, { status: 400 }); }
  } else if (!(typeof body.image === "string" && body.image.startsWith("data:image/") && body.image.length < 8_000_000)) {
    return Response.json({ error: "Send a website URL or a screenshot" }, { status: 400 });
  }
  const name = url ? new URL(url).hostname.replace(/^www\./, "") : "Screenshot clone";
  const p = (await one<{ id: string }>(
    "insert into projects (user_id, name, source_type, source_url) values ($1, $2, $3, $4) returning id",
    [u.id, name, url ? "url" : "image", url ?? null]))!;
  await q("insert into messages (project_id, role, content) values ($1, 'user', $2)", [p.id, url ? `Clone ${url}` : "Clone this screenshot"]);
  startProjectClone(p.id, { url, image: body.image, palette: body.palette });
  return Response.json({ id: p.id });
}
