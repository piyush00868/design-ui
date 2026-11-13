import { Nav } from "@/components/Nav";
import { PromptBox } from "@/components/PromptBox";
import { ProjectGrid } from "@/components/ProjectGrid";
import { requireUser } from "@/lib/server/auth";
import { q } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · DesignDNA" };

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const projects = await q<{ id: string; name: string; source_url: string | null; favicon: string | null; thumbnail: string | null; status: string; updated_at: string; page_count: number }>(
    `select id, name, source_url, favicon, thumbnail, status, updated_at, (select count(*)::int from pages where project_id = projects.id) as page_count
     from projects where user_id = $1 order by updated_at desc limit 100`, [user.id]);
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Nav marketing={false} />
      <section className="mx-auto max-w-[900px] px-5 pb-10 pt-16 text-center">
        <h1 className="display text-[40px] text-white sm:text-[52px]">What are we cloning today, {user.name?.split(" ")[0] || "friend"}?</h1>
        <div className="mt-10"><PromptBox /></div>
      </section>
      <section className="mx-auto mt-14 max-w-[1376px] px-5 pb-24 sm:px-8">
        <div className="mb-6 flex items-end justify-between border-b border-line-strong pb-4">
          <h2 className="h2 text-[26px]">Your projects</h2>
          <span className="font-mono text-[13px] text-muted">{String(projects.length).padStart(2, "0")}</span>
        </div>
        <ProjectGrid initial={projects} />
      </section>
    </main>
  );
}
