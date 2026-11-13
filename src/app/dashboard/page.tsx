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
      <div className="relative">
        <div className="aurora opacity-60" />
        <Nav marketing={false} />
        <section className="relative z-10 mx-auto max-w-3xl px-5 pb-6 pt-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What do you want to clone, {user.name?.split(" ")[0] || "friend"}?</h1>
          <div className="mt-8"><PromptBox /></div>
        </section>
      </div>
      <section className="relative z-10 mx-auto mt-12 max-w-6xl px-5 pb-20">
        <h2 className="mb-4 text-sm font-medium text-muted">Your projects · {projects.length}</h2>
        <ProjectGrid initial={projects} />
      </section>
    </main>
  );
}
