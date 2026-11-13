"use client";
import { ArrowUp, Globe, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { fileToDataUrl, samplePalette } from "@/lib/client/image";

export const PENDING_KEY = "designdna:pending";

export async function createProject(payload: { url?: string; image?: string; palette?: string[] }) {
  const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, id: j.id as string | undefined, error: j.error as string | undefined };
}

const EXAMPLES = ["stripe.com", "linear.app", "vercel.com", "notion.com", "airbnb.com", "apple.com"];

export function PromptBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("That file isn't an image.");
    setErr("");
    setImage({ url: await fileToDataUrl(f), name: f.name || "screenshot.png" });
  }, []);

  const submit = async (override?: string) => {
    const v = (override ?? value).trim();
    let payload: { url?: string; image?: string; palette?: string[] };
    if (image) {
      payload = { image: image.url, palette: await samplePalette(image.url).catch(() => []) };
    } else {
      if (!v) return setErr("Paste a website URL or attach a screenshot.");
      if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(v)) return setErr("That doesn't look like a URL. Try something like stripe.com");
      payload = { url: v };
    }
    setBusy(true); setErr("");
    const r = await createProject(payload);
    if (r.status === 401) {
      // remember what they wanted, send them to sign up, then continue at /new
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch {}
      router.push("/signup?next=/new");
      return;
    }
    if (!r.id) { setErr(r.error || "Something went wrong"); setBusy(false); return; }
    router.push(`/project/${r.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`glass relative rounded-3xl p-3 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] transition ${drag ? "ring-2 ring-pink-400/70" : ""}`}
      >
        {image && (
          <div className="mb-2 flex items-center gap-3 rounded-2xl border border-line bg-white/5 p-2 pr-3 fade-up">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-12 w-20 rounded-lg object-cover object-top" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{image.name}</div>
              <div className="text-xs text-faint">Screenshot · we&apos;ll rebuild it with AI</div>
            </div>
            <button onClick={() => setImage(null)} className="rounded-md p-1 text-faint hover:bg-white/10 hover:text-white" aria-label="Remove image">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          onPaste={(e) => { const f = Array.from(e.clipboardData.files)[0]; if (f) { e.preventDefault(); onFile(f); } }}
          rows={2}
          placeholder={image ? "Add a note (optional) and hit enter" : "Paste a website URL, e.g. stripe.com, or drop a screenshot"}
          className="w-full resize-none bg-transparent px-3 pt-2 text-[16px] text-white placeholder:text-faint focus:outline-none"
          autoFocus
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-xs text-muted hover:bg-white/10 hover:text-white">
              <ImagePlus className="h-3.5 w-3.5" /> Screenshot
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-faint sm:flex">
              <Globe className="h-3.5 w-3.5" /> Live URL
            </span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <button
            onClick={() => submit()}
            disabled={busy}
            aria-label="Clone website"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {err && <p className="mt-3 text-center text-sm text-pink-300">{err}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-faint">Try:</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => { setValue(ex); submit(ex); }} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted transition hover:border-line-strong hover:bg-white/10 hover:text-white">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
