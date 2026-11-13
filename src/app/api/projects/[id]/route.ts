import { q } from "@/lib/server/db";
import { apiUser, ownedProject, projectBundle } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await projectBundle(p));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const { name } = await req.json().catch(() => ({}));
  if (typeof name === "string" && name.trim()) await q("update projects set name = $2, updated_at = now() where id = $1", [p.id, name.trim().slice(0, 80)]);
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  await q("delete from projects where id = $1", [p.id]);
  return Response.json({ ok: true });
}
