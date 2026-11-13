"use client";
import { Code2, Download, Eye, Loader2, Monitor, RefreshCw, Smartphone, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { CopyButton, download } from "./CodeBlock";

export function CodePanel({ designMd, screenshot, name, html, setHtml }: { designMd: string; screenshot?: string; name: string; html: string; setHtml: (h: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const abort = useRef<AbortController | null>(null);

  const generate = async () => {
    setBusy(true); setErr(""); setHtml(""); setView("code");
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/recreate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designMd, screenshot }), signal: abort.current.signal });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setHtml(acc);
      }
      acc = acc.replace(/^```html?\s*/i, "").replace(/```\s*$/, "");
      setHtml(acc);
      setView("preview");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!html && !busy) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-panel/60 px-6 py-20 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6d82ff]/25 to-[#ff5c9d]/25"><Sparkles className="h-6 w-6 text-white" /></div>
        <h3 className="mt-4 text-lg font-medium text-white">Recreate this design as code</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">AI builds a responsive HTML + Tailwind page using the exact tokens from the DESIGN.md{screenshot ? " and the layout from the screenshot" : ""}.</p>
        <button onClick={generate} className="mt-6 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200">
          <Sparkles className="h-4 w-4" /> Generate code
        </button>
        {err && <p className="mt-4 max-w-md text-sm text-pink-300">{err}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex rounded-lg border border-line p-0.5 text-xs">
          <button onClick={() => setView("preview")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 ${view === "preview" ? "bg-white/10 text-white" : "text-muted"}`}><Eye className="h-3.5 w-3.5" /> Preview</button>
          <button onClick={() => setView("code")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 ${view === "code" ? "bg-white/10 text-white" : "text-muted"}`}><Code2 className="h-3.5 w-3.5" /> Code</button>
        </div>
        <div className="flex items-center gap-2">
          {busy && <span className="flex items-center gap-1.5 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing code… {Math.round(html.length / 1000)}k chars</span>}
          {view === "preview" && (
            <div className="flex rounded-lg border border-line p-0.5">
              <button onClick={() => setDevice("desktop")} className={`rounded-md p-1 ${device === "desktop" ? "bg-white/10 text-white" : "text-faint"}`} aria-label="Desktop"><Monitor className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDevice("mobile")} className={`rounded-md p-1 ${device === "mobile" ? "bg-white/10 text-white" : "text-faint"}`} aria-label="Mobile"><Smartphone className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {!busy && <button onClick={generate} className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" /> Regenerate</button>}
          <CopyButton text={html} />
          <button onClick={() => download(`${name.toLowerCase().replace(/\W+/g, "-")}.html`, html, "text/html")} className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10"><Download className="h-3.5 w-3.5" /> .html</button>
        </div>
      </div>
      {view === "preview" ? (
        <div className="flex justify-center bg-[#0d0d12] p-3">
          <iframe title="Recreated design" srcDoc={busy ? undefined : html} sandbox="allow-scripts" className={`h-[72vh] rounded-lg border border-line bg-white transition-all ${device === "mobile" ? "w-[390px]" : "w-full"}`} />
        </div>
      ) : (
        <pre className="scroll-thin h-[72vh] overflow-auto bg-[#0d0d12] p-4 font-mono text-[12px] leading-relaxed text-zinc-300">{html}{busy && <span className="animate-pulse">▍</span>}</pre>
      )}
    </div>
  );
}
