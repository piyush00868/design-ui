import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/Logo";
import { currentUser, oauthProviders } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in · DesignDNA" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect(sp.next?.startsWith("/") ? sp.next : "/dashboard");
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="aurora" />
      <div className="relative z-10 flex w-full flex-col items-center gap-8">
        <Logo />
        <Suspense><AuthForm mode="login" providers={oauthProviders()} /></Suspense>
      </div>
    </main>
  );
}
