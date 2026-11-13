import { one } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Public share link for the latest version of a page (ids are unguessable UUIDs). */
export async function GET(_: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(pageId)) return new Response("Not found", { status: 404 });
  const row = await one<{ html: string }>("select html from versions where page_id = $1 order by created_at desc limit 1", [pageId]);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(row.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "frame-ancestors *", "X-Robots-Tag": "noindex" } });
}
