import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentUser, oauthProviders } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign up · DesignDNA" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect(sp.next?.startsWith("/") ? sp.next : "/dashboard");
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Logo byline /><ThemeToggle /></div>
        <div className="flex flex-1 items-center justify-center py-12">
          <Suspense><AuthForm mode="signup" providers={oauthProviders()} /></Suspense>
        </div>
        <p className="text-[12px] text-faint">Free for students and developers · open source</p>
      </div>
      <div className="relative hidden overflow-hidden border-l border-line-strong bg-panel lg:block">
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8 opacity-90" style={{ transform: "rotate(-8deg) scale(1.25)" }}>
          {["stripe", "framer", "notion", "vercel", "raycast", "resend", "supabase", "figma"].map((s) => (
            <div key={s} className="bg-[#232223] p-2 pb-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sites/${s}.jpg`} alt="" className="aspect-[16/10] w-full object-cover object-top" />
              <div className="mt-1.5 text-[10px] text-[#8c8b8c]">{s}</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141314] via-[#141314]/40 to-transparent" />
        <div className="absolute inset-x-10 bottom-10">
          <p className="display max-w-[440px] text-[36px] text-[#eeeeee]">Every great site started as a reference.</p>
          <p className="mt-3 text-[15px] text-[#8c8b8c]">Clone it, learn from it, make it yours.</p>
        </div>
      </div>
    </main>
  );
}
