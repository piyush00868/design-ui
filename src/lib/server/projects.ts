import { currentUser, type User } from "./auth";
import { one, q } from "./db";

export type ProjectRow = {
  id: string; user_id: string; name: string; source_type: string; source_url: string | null; favicon: string | null;
  thumbnail: string | null; status: string; error: string | null; tokens: unknown; design_md: string | null;
  nav_links: { path: string; label: string; url: string }[] | null; created_at: string; updated_at: string;
};
export type PageRow = { id: string; project_id: string; path: string; title: string; source_url: string | null; created_at: string };

export async function apiUser(): Promise<User | Response> {
  const u = await currentUser();
  return u ?? Response.json({ error: "Please log in" }, { status: 401 });
}

export async function ownedProject(id: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return one<ProjectRow>("select * from projects where id = $1 and user_id = $2", [id, userId]);
}

export async function latestHtml(pageId: string) {
  return (await one<{ html: string }>("select html from versions where page_id = $1 order by created_at desc limit 1", [pageId]))?.html ?? null;
}

export async function projectBundle(p: ProjectRow) {
  const pages = await q<PageRow & { version_count: number }>(
    `select pg.id, pg.project_id, pg.path, pg.title, pg.source_url, pg.created_at, (select count(*)::int from versions v where v.page_id = pg.id) as version_count
     from pages pg where pg.project_id = $1 order by pg.created_at`, [p.id]);
  const messages = await q("select id, page_id, role, content, created_at from messages where project_id = $1 order by created_at", [p.id]);
  return { project: p, pages, messages };
}
