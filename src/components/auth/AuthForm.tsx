"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GithubIcon } from "../icons";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function AuthForm({ mode, providers }: { mode: "login" | "signup"; providers: { github: boolean; google: boolean } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const [err, setErr] = useState(sp.get("error") || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error || "Something went wrong"); setBusy(false); return; }
    router.push(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  };

  const anyOAuth = providers.github || providers.google;
  const input = "w-full rounded-xl border border-line-strong bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-faint focus:border-pink-400/60 focus:outline-none focus:ring-2 focus:ring-pink-400/20";
  return (
    <div className="glass w-full max-w-sm rounded-3xl p-7 shadow-[0_30px_100px_-30px_rgba(0,0,0,0.9)]">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1.5 text-sm text-muted">{mode === "login" ? "Log in to see your projects." : "Free for students and developers."}</p>

      {anyOAuth && (
        <div className="mt-6 space-y-2">
          {providers.google && (
            <a href={`/api/auth/oauth/google?next=${encodeURIComponent(next)}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white/5 py-2.5 text-sm text-white hover:bg-white/10"><GoogleIcon /> Continue with Google</a>
          )}
          {providers.github && (
            <a href={`/api/auth/oauth/github?next=${encodeURIComponent(next)}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white/5 py-2.5 text-sm text-white hover:bg-white/10"><GithubIcon /> Continue with GitHub</a>
          )}
          <div className="flex items-center gap-3 py-2 text-xs text-faint"><span className="h-px flex-1 bg-line-strong" />or<span className="h-px flex-1 bg-line-strong" /></div>
        </div>
      )}

      <form onSubmit={submit} className={`${anyOAuth ? "" : "mt-6"} space-y-3`}>
        {mode === "signup" && <input name="name" required placeholder="Your name" autoComplete="name" className={input} />}
        <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" className={input} />
        <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={input} />
        {err && <p className="text-sm text-pink-300">{err}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-white hover:underline">Create an account</Link></> : <>Have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-white hover:underline">Log in</Link></>}
      </p>
    </div>
  );
}
