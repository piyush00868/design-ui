import { getJob } from "@/lib/clone/jobs";
import { one } from "@/lib/server/db";
import { apiUser, ownedProject } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

/** Live progress for a clone job (polled by the editor). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser(); if (u instanceof Response) return u;
  const p = await ownedProject((await params).id, u.id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const pageId = new URL(req.url).searchParams.get("page") || undefined;
  let job = getJob(p.id, pageId);
  // the home job is keyed without a page id
  if (!job && pageId) {
    const home = await one<{ id: string }>("select id from pages where project_id = $1 and path = '/'", [p.id]);
    if (home?.id === pageId) job = getJob(p.id);
  }
  if (job) return Response.json({ status: job.status, steps: job.steps, html: job.html, error: job.error, pageId: job.pageId, elapsed: Date.now() - job.startedAt });
  // no in-memory job: either finished earlier or the server restarted mid-clone
  const status = p.status === "cloning" ? "error" : p.status === "error" ? "error" : "done";
  return Response.json({ status, steps: [], html: "", error: p.status === "cloning" ? "The clone was interrupted. Please try again." : p.error });
}
