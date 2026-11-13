"use client";
import { AlertCircle, Check, Code2, Download, FileText, Globe, Image as ImageIcon, Layers, Loader2, Palette, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { CodePanel } from "@/components/studio/CodePanel";
import { CopyButton, download } from "@/components/studio/CodeBlock";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { MarkdownView } from "@/components/studio/MarkdownView";
import { StyleGuide } from "@/components/studio/StyleGuide";
import { getFromHistory } from "@/lib/client/history";
import { samplePalette } from "@/lib/client/image";
import { useExtraction } from "@/lib/client/useExtraction";

type Tab = "preview" | "designmd" | "code" | "export";
const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "preview", label: "Style guide", icon: Palette },
  { id: "designmd", label: "DESIGN.md", icon: FileText },
  { id: "code", label: "Code", icon: Code2 },
  { id: "export", label: "Export", icon: Layers },
];

function Studio() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url");
  const id = params.get("id");
  const mode = params.get("mode");
  const { steps, status, error, result, partial, run, setResult, setStatus } = useExtraction();
  const [tab, setTab] = useState<Tab>("preview");
  const [html, setHtml] = useState("");
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const r = getFromHistory(id);
      if (r) { setResult(r); setStatus("done"); return; }
    }
    if (url) { run({ url }); return; }
    if (mode === "image") {
      const img = sessionStorage.getItem("designdna:pending-image");
      if (!img) { router.replace("/"); return; }
      setSourceImage(img);
      samplePalette(img).then((palette) => run({ image: img, palette })).catch(() => run({ image: img }));
    }
  }, [id, url, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // put the result id in the URL so refresh / back works without re-extracting
  useEffect(() => {
    if (result && !id) router.replace(`/studio?id=${result.id}`, { scroll: false });
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const tokens = result?.tokens ?? partial?.tokens;
  const screenshot = result?.screenshot ?? partial?.screenshot ?? sourceImage ?? undefined;
  const host = useMemo(() => {
    const u = result?.source.url ?? url;
    if (!u) return result?.source.type === "image" || mode === "image" ? "Screenshot" : "";
    try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, ""); } catch { return u; }
  }, [result, url, mode]);
  const fileBase = (result?.tokens.name ?? host ?? "design").toLowerCase().replace(/\W+/g, "-");

  return (
    <div className="flex h-screen flex-col bg-ink">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="sm" />
          <span className="hidden h-5 w-px bg-line-strong sm:block" />
          <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1 text-sm text-muted sm:flex">
            {result?.source.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.source.favicon} alt="" className="h-4 w-4 rounded-sm" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : mode === "image" || result?.source.type === "image" ? <ImageIcon className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            <span className="truncate">{host}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <>
              <CopyButton text={result.designMd} label="Copy DESIGN.md" className="hidden md:flex" />
              <button onClick={() => download(`DESIGN.md`, result.designMd, "text/markdown")} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200">
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span> DESIGN.md
              </button>
            </>
          )}
          <Link href="/" className="flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left: process log + summary (Lovable-style chat column) */}
        <aside className="scroll-thin shrink-0 overflow-y-auto border-b border-line p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
          <div className="rounded-2xl border border-line bg-panel p-4">
            <div className="mb-1 text-xs text-faint">You</div>
            <div className="text-sm text-white">Extract the design system from <span className="font-medium">{host || "…"}</span></div>
            {screenshot && mode === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={screenshot} alt="" className="mt-3 max-h-40 w-full rounded-lg object-cover object-top" />
            )}
          </div>

          <div className="mt-4 flex items-start gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6d82ff] via-[#ff5c9d] to-[#ff9d4d]"><Sparkles className="h-3.5 w-3.5 text-white" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-faint">DesignDNA</div>
              {id && result && !steps.length ? (
                <p className="mt-1 text-sm text-muted">Loaded from your history.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {steps.map((s, i) => {
                    const last = i === steps.length - 1;
                    const active = last && status === "running";
                    return (
                      <li key={i} className="fade-up flex items-center gap-2 text-sm">
                        {active ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-pink-300" /> : <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                        <span className={active ? "text-white" : "text-muted"}>{s.message}</span>
                      </li>
                    );
                  })}
                  {status === "running" && !steps.length && (
                    <li className="flex items-center gap-2 text-sm text-white"><Loader2 className="h-3.5 w-3.5 animate-spin text-pink-300" /> Starting…</li>
                  )}
                </ul>
              )}
              {status === "error" && (
                <div className="mt-3 flex gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 p-3 text-sm text-pink-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    {error}
                    <div className="mt-2 flex gap-2">
                      {url && <button onClick={() => run({ url })} className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Try again</button>}
                      <Link href="/" className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">Back</Link>
                    </div>
                  </div>
                </div>
              )}
              {result && (
                <p className="fade-up mt-3 text-sm leading-relaxed text-muted">
                  Found <b className="text-white">{Object.keys(result.tokens.colors).length} colors</b>, <b className="text-white">{Object.keys(result.tokens.typography).length} type levels</b> and <b className="text-white">{Object.keys(result.tokens.components).length} components</b>.
                  {!result.aiUsed && " (AI prose disabled: add an OpenAI key for richer descriptions.)"}
                </p>
              )}
            </div>
          </div>

          {tokens && (
            <div className="fade-up mt-6 space-y-5">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Palette</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(tokens.colors).map(([k, v]) => (
                    <button key={k} title={`${k} ${v}`} onClick={() => navigator.clipboard.writeText(v)} className="h-8 w-8 rounded-lg border border-white/10 transition hover:scale-110" style={{ background: v }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Fonts</div>
                <div className="space-y-1.5">
                  {tokens.fonts.map((f) => (
                    <div key={f.family} className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2 text-sm">
                      <span className="truncate text-white">{f.family}</span><span className="text-xs text-faint">{f.role}</span>
                    </div>
                  ))}
                </div>
              </div>
              {result && (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-faint">Next</div>
                  <button onClick={() => setTab("code")} className="flex w-full items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-left text-sm text-white hover:border-line-strong">
                    <Code2 className="h-4 w-4 text-pink-300" /> Recreate it as code
                  </button>
                  <button onClick={() => setTab("export")} className="flex w-full items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-left text-sm text-white hover:border-line-strong">
                    <Layers className="h-4 w-4 text-pink-300" /> Export Tailwind / CSS tokens
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* right: tabs */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
            {TABS.map((t) => {
              const disabled = !result && t.id !== "preview";
              return (
                <button key={t.id} disabled={disabled} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${tab === t.id ? "bg-white/10 text-white" : "text-muted hover:text-white"} disabled:cursor-not-allowed disabled:opacity-40`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
            <span className="ml-auto hidden pr-1 text-xs text-faint md:block">{result ? `${result.aiUsed ? "Measured + AI" : "Measured"} · ${new Date(result.createdAt).toLocaleString()}` : ""}</span>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {!tokens && status !== "error" && <Skeleton />}
            {!tokens && status === "error" && <div className="grid h-full place-items-center text-sm text-faint">Nothing to show yet.</div>}
            {tokens && tab === "preview" && <StyleGuide tokens={tokens} screenshot={screenshot} />}
            {result && tab === "designmd" && <MarkdownView md={result.designMd} />}
            {result && tab === "code" && <CodePanel designMd={result.designMd} screenshot={result.screenshot} name={fileBase} html={html} setHtml={setHtml} />}
            {result && tab === "export" && <ExportPanel tokens={result.tokens} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="shimmer h-80 rounded-2xl border border-line" />
        <div className="shimmer h-80 rounded-2xl border border-line" />
      </div>
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-xl border border-line" />)}
      </div>
      <div className="shimmer h-64 rounded-2xl border border-line" />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-ink" />}>
      <Studio />
    </Suspense>
  );
}
