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

const EXAMPLES = ["stripe.com", "linear.app", "vercel.com", "notion.com", "framer.com"];

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
    <div className="mx-auto w-full max-w-[640px]">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`relative border bg-[#1b1a1b]/90 backdrop-blur-md transition-colors [html.light_&]:bg-white/90 ${drag ? "border-accent" : "border-line-strong focus-within:border-white/30"}`}
      >
        {image && (
          <div className="flex items-center gap-3 border-b border-line-strong p-2 pr-3 fade-up">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-11 w-[72px] object-cover object-top" />
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[14px] text-white">{image.name}</div>
              <div className="text-[12px] text-muted">Screenshot · rebuilt with AI</div>
            </div>
            <button onClick={() => setImage(null)} className="p-1 text-muted hover:text-white" aria-label="Remove image"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="flex items-center gap-2 p-2">
          <Globe className="ml-2 h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files)[0]; if (f) { e.preventDefault(); onFile(f); } }}
            placeholder={image ? "Press clone to rebuild your screenshot" : "Paste any website, e.g. stripe.com"}
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-faint focus:outline-none"
            aria-label="Website URL"
          />
          <button onClick={() => fileRef.current?.click()} title="Upload a screenshot" className="grid h-11 w-11 shrink-0 place-items-center text-muted transition-colors hover:bg-white/10 hover:text-white" aria-label="Upload screenshot">
            <ImagePlus className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button onClick={() => submit()} disabled={busy} className="btn btn-accent shrink-0 disabled:opacity-70">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Clone <ArrowUp className="h-4 w-4 rotate-45" /></>}
          </button>
        </div>
      </div>
      {err && <p className="mt-3 text-[14px] text-accent">{err}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px]">
        <span className="text-muted">Try</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => { setValue(ex); submit(ex); }} className="text-soft underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-accent">{ex}</button>
        ))}
      </div>
    </div>
  );
}
