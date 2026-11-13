"use client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createProject, PENDING_KEY } from "@/components/PromptBox";

/** Landing spot after sign-up: finishes the clone the visitor started before logging in. */
export default function NewPage() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) { router.replace("/dashboard"); return; }
    sessionStorage.removeItem(PENDING_KEY);
    createProject(JSON.parse(raw)).then((r) => {
      if (r.id) router.replace(`/project/${r.id}`);
      else if (r.status === 401) router.replace("/login?next=/dashboard");
      else setErr(r.error || "Something went wrong");
    });
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center text-sm text-muted">
      {err ? <p className="text-accent">{err}</p> : <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Starting your clone…</p>}
    </main>
  );
}
