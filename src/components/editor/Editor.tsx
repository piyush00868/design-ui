"use client";
import {
  ArrowUp, Check, ChevronDown, Code2, Copy, Download, ExternalLink, FileCode2, FileText, Globe, History, Loader2,
  Monitor, MousePointerClick, Palette, Plus, Share2, Smartphone, Sparkles, Tablet, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "../Logo";
import { download } from "../studio/CodeBlock";
import { ExportPanel } from "../studio/ExportPanel";
import { MarkdownView } from "../studio/MarkdownView";
import { StyleGuide } from "../studio/StyleGuide";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { withEditorScript } from "./previewScript";
import type { DesignTokens } from "@/lib/types";

type Page = { id: string; path: string; title: string; source_url: string | null; version_count: number };
type Message = { id: string; page_id: string | null; role: "user" | "assistant"; content: string; created_at: string; pending?: boolean };
type Project = {
  id: string; name: string; source_type: string; source_url: string | null; favicon: string | null; status: string; error: string | null;
  tokens: DesignTokens | null; design_md: string | null; nav_links: { path: string; label: string; url: string }[] | null; thumbnail: string | null;
};
type Version = { id: string; prompt: string; created_at: string };
type JobState = { status: "running" | "done" | "error"; steps: string[]; html: string; error?: string; pageId?: string; elapsed?: number };

const SUGGESTIONS = [
  "Change the brand color to emerald green",
  "Rewrite the hero for my AI note-taking startup",
  "Make it dark mode",
  "Add a pricing section with 3 tiers",
];

export function Editor({ projectId, user }: { projectId: string; user: { name: string | null; email: string; avatar_url: string | null } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pageId, setPageId] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [liveHtml, setLiveHtml] = useState(""); // streaming / in-progress html
  const [job, setJob] = useState<JobState | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [viewingVersion, setViewingVersion] = useState<{ id: string; html: string } | null>(null);
  const [tab, setTab] = useState<"preview" | "code" | "design">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectMode, setSelectMode] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState<null | "export" | "versions" | "pages">(null);
  const [react, setReact] = useState<{ code: string; busy: boolean } | null>(null);
  const [toast, setToast] = useState("");
  const [frameLoading, setFrameLoading] = useState(true);
  const iframe = useRef<HTMLIFrameElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  const loadVersions = useCallback(async (pid: string) => {
    const r = await fetch(`/api/projects/${projectId}/versions?page=${pid}`).then((r) => r.json());
    setVersions(r.versions || []);
    if (r.latest) setHtml(r.latest.html);
    return r;
  }, [projectId]);

  const loadProject = useCallback(async () => {
    const r = await fetch(`/api/projects/${projectId}`).then((r) => r.json());
    if (r.error) return null;
    setProject(r.project); setPages(r.pages); setMessages(r.messages);
    return r as { project: Project; pages: Page[]; messages: Message[] };
  }, [projectId]);

  // initial load
  useEffect(() => {
    loadProject().then((r) => {
      if (!r) return;
      const home = r.pages.find((p) => p.path === "/") ?? r.pages[0];
      if (home) setPageId(home.id);
      if (r.project.status === "cloning" || !home) pollJob();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // when page changes, load its latest html
  useEffect(() => {
    if (!pageId) return;
    setViewingVersion(null); setSection(null);
    const pg = pages.find((p) => p.id === pageId);
    if (pg && pg.version_count === 0) { setHtml(""); pollJob(pageId); }
    else loadVersions(pageId);
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const polling = useRef<string | null>(null);
  const pollJob = useCallback((pid?: string) => {
    const key = pid ?? "home";
    if (polling.current === key) return;
    polling.current = key;
    const tick = async () => {
      if (polling.current !== key) return;
      const r: JobState = await fetch(`/api/projects/${projectId}/status${pid ? `?page=${pid}` : ""}`).then((r) => r.json()).catch(() => null);
      if (!r) { setTimeout(tick, 2000); return; }
      setJob(r);
      if (r.html) setLiveHtml(r.html);
      if (r.pageId && !pid) setPageId((cur) => cur ?? r.pageId!);
      if (r.status === "running") { setTimeout(tick, 1200); return; }
      polling.current = null;
      const b = await loadProject();
      if (r.status === "done") {
        const target = pid ?? b?.pages.find((p) => p.path === "/")?.id;
        if (target) { setPageId(target); await loadVersions(target); }
        setLiveHtml("");
        setTimeout(() => setJob(null), 1500);
      }
    };
    tick();
  }, [projectId, loadProject, loadVersions]);

  // throttle iframe updates while streaming so it doesn't flicker
  const [previewSrc, setPreviewSrc] = useState("");
  const lastPush = useRef(0);
  const shownHtml = viewingVersion?.html ?? (liveHtml && (job?.status === "running" || editing) ? liveHtml : html);
  useEffect(() => {
    const now = Date.now();
    const streaming = job?.status === "running" || editing;
    const wait = streaming ? Math.max(0, 2500 - (now - lastPush.current)) : 0;
    const t = setTimeout(() => {
      if (streaming && !/<body/i.test(shownHtml)) return;
      lastPush.current = Date.now();
      const next = withEditorScript(shownHtml);
      setPreviewSrc((cur) => { if (cur !== next && !streaming) setFrameLoading(true); return next; });
    }, wait);
    return () => clearTimeout(t);
  }, [shownHtml, job?.status, editing]);

  // iframe <-> editor messages
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      if (e.data?.dd === "section") { setSection(e.data.name); setSelectMode(false); }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  const syncIframe = useCallback(() => {
    const w = iframe.current?.contentWindow;
    w?.postMessage({ dd: "select-mode", on: selectMode }, "*");
    w?.postMessage({ dd: "selected", name: section }, "*");
  }, [selectMode, section]);
  useEffect(() => { syncIframe(); }, [syncIframe]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, job?.steps.length, editing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !pageId || editing) return;
    setInput(""); setEditing(true); setViewingVersion(null); setTab("preview");
    const target = section;
    setMessages((m) => [...m, { id: crypto.randomUUID(), page_id: pageId, role: "user", content: target ? `[${target}] ${msg}` : msg, created_at: new Date().toISOString() },
      { id: "pending", page_id: pageId, role: "assistant", content: "", created_at: new Date().toISOString(), pending: true }]);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId, message: msg, section: target }) });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || "Edit failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === "pending" ? { ...x, content: `${Math.round(acc.length / 100) / 10}k` } : x)));
        if (!target && acc.includes("<body")) setLiveHtml(acc);
      }
      const done = acc.match(/<<<DD_DONE:([\s\S]*)>>>$/);
      const err = acc.match(/<<<DD_ERROR:([\s\S]*)>>>$/);
      if (err) throw new Error(JSON.parse(err[1]).error);
      if (!done) throw new Error("The edit didn't finish. Try again.");
      const d = JSON.parse(done[1]);
      setHtml(d.html);
      setMessages((m) => m.map((x) => (x.id === "pending" ? { ...x, id: crypto.randomUUID(), content: d.reply, pending: false } : x)));
      loadVersions(pageId);
      setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, version_count: p.version_count + 1 } : p)));
    } catch (e) {
      setMessages((m) => m.map((x) => (x.id === "pending" ? { ...x, id: crypto.randomUUID(), content: `Sorry, that didn't work: ${(e as Error).message}`, pending: false } : x)));
    } finally {
      setEditing(false); setLiveHtml("");
    }
  };

  const restore = async (v: Version) => {
    const r = await fetch(`/api/projects/${projectId}/versions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId, versionId: v.id }) }).then((r) => r.json());
    if (r.html) { setHtml(r.html); setViewingVersion(null); loadVersions(pageId!); flash("Version restored"); }
  };
  const previewVersion = async (v: Version, isLatest: boolean) => {
    setMenu(null);
    if (isLatest) { setViewingVersion(null); return; }
    const r = await fetch(`/api/projects/${projectId}/versions?page=${pageId}&v=${v.id}`).then((r) => r.json());
    if (r.html) setViewingVersion({ id: v.id, html: r.html });
  };

  const addPage = async (l: { url: string; label: string }) => {
    setMenu(null);
    const r = await fetch(`/api/projects/${projectId}/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(l) }).then((r) => r.json());
    if (r.pageId && !r.error) {
      setPages((ps) => [...ps, { id: r.pageId, path: new URL(l.url).pathname, title: l.label, source_url: l.url, version_count: 0 }]);
      setHtml(""); setPageId(r.pageId);
    } else if (r.pageId) setPageId(r.pageId);
    else flash(r.error || "Couldn't add page");
  };

  const toReact = async () => {
    setMenu(null); setReact({ code: "", busy: true });
    const res = await fetch(`/api/projects/${projectId}/react`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId }) });
    const reader = res.body!.getReader(); const dec = new TextDecoder(); let acc = "";
    while (true) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setReact({ code: acc, busy: true }); }
    setReact({ code: acc.replace(/^```\w*\s*/, "").replace(/```\s*$/, ""), busy: false });
  };

  const page = pages.find((p) => p.id === pageId);
  const fileBase = (project?.name || "site").toLowerCase().replace(/\W+/g, "-") + (page && page.path !== "/" ? page.path.replace(/\W+/g, "-") : "");
  const remainingNav = useMemo(() => (project?.nav_links || []).filter((l) => !pages.some((p) => p.path === l.path)), [project, pages]);
  const building = job?.status === "running";
  const pageMessages = messages.filter((m) => !m.page_id || m.page_id === pageId || pages.length <= 1);
  const deviceW = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";
  const shareUrl = typeof window !== "undefined" && pageId ? `${window.location.origin}/api/preview/${pageId}` : "";

  return (
    <div className="flex h-screen flex-col bg-ink text-white" onClick={() => menu && setMenu(null)}>
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="sm" />
          <span className="h-5 w-px bg-line-strong" />
          <Link href="/dashboard" className="hidden text-sm text-muted hover:text-white sm:block">Projects</Link>
          <span className="hidden text-faint sm:block">/</span>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {project?.favicon ? <img src={project.favicon} alt="" className="h-4 w-4 rounded-sm" /> : <Globe className="h-4 w-4 text-faint" />}
            <span className="truncate font-medium">{project?.name ?? "Loading…"}</span>
          </div>
        </div>

        <div className="hidden items-center rounded-xl border border-line bg-panel p-0.5 md:flex">
          {([["preview", Monitor, "Preview"], ["code", Code2, "Code"], ["design", Palette, "Design system"]] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${tab === id ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button disabled={!html} onClick={() => setMenu(menu === "export" ? null : "export")} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50">
              <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {menu === "export" && (
              <div className="glass absolute right-0 top-10 z-50 w-64 rounded-2xl p-1.5 text-sm fade-up">
                <MenuItem icon={FileCode2} label="Download HTML" sub="Single file, Tailwind" onClick={() => { download(`${fileBase}.html`, html, "text/html"); setMenu(null); }} />
                <MenuItem icon={Copy} label="Copy HTML" onClick={() => { navigator.clipboard.writeText(html); setMenu(null); flash("HTML copied"); }} />
                <MenuItem icon={Code2} label="Convert to React" sub="Next.js + Tailwind component" onClick={toReact} />
                <MenuItem icon={FileText} label="Download DESIGN.md" sub="For Cursor, Claude Code, v0" onClick={() => { download("DESIGN.md", project?.design_md || "", "text/markdown"); setMenu(null); }} />
                <div className="my-1 h-px bg-line" />
                <MenuItem icon={Share2} label="Copy share link" sub="Anyone with the link can view" onClick={() => { navigator.clipboard.writeText(shareUrl); setMenu(null); flash("Share link copied"); }} />
                <MenuItem icon={ExternalLink} label="Open in new tab" onClick={() => { window.open(shareUrl, "_blank"); setMenu(null); }} />
              </div>
            )}
          </div>
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* chat column */}
        <aside className="flex w-full max-w-[400px] shrink-0 flex-col border-r border-line max-md:hidden">
          <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
            {pageMessages.map((m) => (
              <div key={m.id} className="fade-up">
                {m.role === "user" ? (
                  <div className="ml-8 rounded-2xl rounded-tr-md bg-white/[0.07] px-4 py-2.5 text-sm text-white">
                    {m.content.startsWith("[") ? (
                      <><span className="mb-1 inline-flex items-center gap-1 rounded-md bg-[#6d82ff]/20 px-1.5 py-0.5 text-[11px] text-[#aab6ff]"><MousePointerClick className="h-3 w-3" />{m.content.slice(1, m.content.indexOf("]"))}</span><br />{m.content.slice(m.content.indexOf("]") + 2)}</>
                    ) : m.content}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Avatar />
                    <div className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-zinc-300">
                      {m.pending ? <span className="flex items-center gap-2 text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin text-pink-300" /> Editing{m.content ? ` · ${m.content} chars` : "…"}</span> : m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {job && (job.status === "running" || job.status === "error" || job.steps.length > 0) && (
              <div className="flex gap-3 fade-up">
                <Avatar />
                <div className="min-w-0 flex-1 rounded-2xl border border-line bg-panel p-3">
                  <ul className="space-y-1.5">
                    {job.steps.map((s, i) => {
                      const active = i === job.steps.length - 1 && job.status === "running";
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {active ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-pink-300" /> : <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                          <span className={active ? "text-white" : "text-muted"}>{s}{active && s.startsWith("Rebuilding") && job.html ? ` · ${Math.round(job.html.length / 1000)}k chars` : ""}</span>
                        </li>
                      );
                    })}
                    {job.status === "running" && !job.steps.length && <li className="flex items-center gap-2 text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin text-pink-300" /> Starting…</li>}
                  </ul>
                  {job.status === "error" && <p className="mt-2 text-sm text-pink-300">{job.error}</p>}
                </div>
              </div>
            )}
            {project?.status === "error" && !job && <p className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-3 text-sm text-pink-200">{project.error || "This clone failed."} <Link href="/dashboard" className="underline">Try again</Link></p>}
            {html && !editing && pageMessages.filter((m) => m.role === "user").length <= 1 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-faint">Try asking</div>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-line bg-panel px-3 py-2 text-left text-sm text-muted hover:border-line-strong hover:text-white">{s}</button>
                ))}
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* composer */}
          <div className="border-t border-line p-3">
            <div className={`rounded-2xl border bg-panel p-2 transition ${section ? "border-[#6d82ff]/50" : "border-line-strong"}`}>
              {section && (
                <div className="mb-1.5 flex items-center gap-1.5 px-1">
                  <span className="flex items-center gap-1 rounded-md bg-[#6d82ff]/20 px-2 py-0.5 text-xs text-[#aab6ff]"><MousePointerClick className="h-3 w-3" /> Editing: {section}</span>
                  <button onClick={() => setSection(null)} className="rounded p-0.5 text-faint hover:text-white" aria-label="Clear selection"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <textarea
                value={input} onChange={(e) => setInput(e.target.value)} rows={2} disabled={!html || building}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={building ? "Cloning in progress…" : section ? `What should change in "${section}"?` : "Ask for changes, e.g. swap in my brand colors"}
                className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder:text-faint focus:outline-none disabled:opacity-50"
              />
              <div className="flex items-center justify-between">
                <button onClick={() => { setSelectMode((s) => !s); setTab("preview"); }} disabled={!html}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition disabled:opacity-40 ${selectMode ? "bg-[#6d82ff] text-[#fff]" : "border border-line-strong text-muted hover:text-white"}`}>
                  <MousePointerClick className="h-3.5 w-3.5" /> {selectMode ? "Click a section…" : "Select section"}
                </button>
                <button onClick={() => send()} disabled={!input.trim() || editing || !html} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black disabled:opacity-40" aria-label="Send">
                  {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* canvas */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line px-3">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {pages.map((p) => (
                <button key={p.id} onClick={() => setPageId(p.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs ${p.id === pageId ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
                  <FileText className="h-3.5 w-3.5" />{p.path === "/" ? "Home" : p.title}
                </button>
              ))}
              {project?.source_type === "url" && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button disabled={building || !html} onClick={() => setMenu(menu === "pages" ? null : "pages")} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Page</button>
                  {menu === "pages" && (
                    <div className="glass absolute left-0 top-8 z-50 max-h-80 w-60 overflow-y-auto rounded-2xl p-1.5 text-sm fade-up">
                      <div className="px-3 py-1.5 text-xs text-faint">Clone another page from this site</div>
                      {remainingNav.length ? remainingNav.map((l) => (
                        <button key={l.path} onClick={() => addPage(l)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-muted hover:bg-white/5 hover:text-white">
                          <span className="truncate">{l.label}</span><span className="ml-2 truncate font-mono text-[11px] text-faint">{l.path}</span>
                        </button>
                      )) : <div className="px-3 py-2 text-xs text-faint">No more pages found in the site navigation.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {viewingVersion && (
                <span className="flex items-center gap-2 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs text-amber-200">
                  Viewing an older version
                  <button onClick={() => { const v = versions.find((x) => x.id === viewingVersion.id); if (v) restore(v); }} className="rounded bg-amber-400/20 px-1.5 py-0.5 hover:bg-amber-400/30">Restore</button>
                  <button onClick={() => setViewingVersion(null)} className="hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button disabled={!versions.length} onClick={() => setMenu(menu === "versions" ? null : "versions")} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-white disabled:opacity-40">
                  <History className="h-3.5 w-3.5" /> {versions.length} version{versions.length === 1 ? "" : "s"}
                </button>
                {menu === "versions" && (
                  <div className="glass absolute right-0 top-8 z-50 max-h-96 w-72 overflow-y-auto rounded-2xl p-1.5 text-sm fade-up">
                    {versions.map((v, i) => (
                      <button key={v.id} onClick={() => previewVersion(v, i === 0)} className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-white/5 ${(viewingVersion?.id ?? versions[0]?.id) === v.id ? "bg-white/5" : ""}`}>
                        <div className="flex items-center justify-between gap-2"><span className="truncate text-white">{v.prompt || "Edit"}</span>{i === 0 && <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 text-[10px] text-emerald-300">Current</span>}</div>
                        <div className="text-[11px] text-faint">{new Date(v.created_at).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tab === "preview" && (
                <div className="flex rounded-lg border border-line p-0.5">
                  {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
                    <button key={d} onClick={() => setDevice(d)} className={`rounded-md p-1 ${device === d ? "bg-white/10 text-white" : "text-faint hover:text-white"}`} aria-label={d}><Icon className="h-3.5 w-3.5" /></button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#0d0d12] code-surface">
            {tab === "preview" && (
              previewSrc ? (
                <div className="relative flex h-full justify-center overflow-auto p-3">
                  {frameLoading && !building && !editing && <div className="absolute inset-3 z-10 grid place-items-center rounded-lg bg-panel"><Loader2 className="h-5 w-5 animate-spin text-pink-300" /></div>}
                  <iframe ref={iframe} title="Preview" srcDoc={previewSrc} onLoad={() => { syncIframe(); setTimeout(() => setFrameLoading(false), 350); }} sandbox="allow-scripts"
                    className={`h-full rounded-lg border border-line bg-[#fff] shadow-2xl transition-[width] duration-300 ${selectMode ? "ring-2 ring-[#6d82ff]" : ""}`} style={{ width: deviceW }} />
                </div>
              ) : <BuildingState job={job} thumbnail={project?.thumbnail} />
            )}
            {(building || editing) && tab === "preview" && previewSrc && (
              <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-xs text-white backdrop-blur">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-300" /> {building ? "Building live preview…" : "Applying your edit…"}
              </div>
            )}
            {tab === "code" && (
              <pre className="scroll-thin h-full overflow-auto p-4 font-mono text-[12px] leading-relaxed text-zinc-300">{shownHtml || "Code appears here as the page is built."}{(building || editing) && <span className="animate-pulse">▍</span>}</pre>
            )}
            {tab === "design" && (
              <div className="scroll-thin h-full overflow-y-auto p-6">
                {project?.tokens ? (
                  <div className="mx-auto max-w-6xl space-y-12">
                    <StyleGuide tokens={project.tokens} screenshot={project.thumbnail ?? undefined} />
                    <div><h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">Tokens export</h3><ExportPanel tokens={project.tokens} /></div>
                    {project.design_md && <div><h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">DESIGN.md</h3><MarkdownView md={project.design_md} /></div>}
                  </div>
                ) : <div className="grid h-full place-items-center text-sm text-faint">The design system appears once the site is analyzed.</div>}
              </div>
            )}
          </div>
        </main>
      </div>

      {react && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => !react.busy && setReact(null)}>
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line-strong bg-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium">{react.busy && <Loader2 className="h-4 w-4 animate-spin text-pink-300" />} page.tsx</span>
              <div className="flex gap-2">
                <button disabled={react.busy} onClick={() => { navigator.clipboard.writeText(react.code); flash("Copied"); }} className="rounded-lg border border-line-strong px-2.5 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50">Copy</button>
                <button disabled={react.busy} onClick={() => download("page.tsx", react.code)} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-black disabled:opacity-50">Download</button>
                <button onClick={() => setReact(null)} className="rounded-lg p-1.5 text-muted hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <pre className="scroll-thin flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed text-zinc-300">{react.code}{react.busy && <span className="animate-pulse">▍</span>}</pre>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-xl fade-up">{toast}</div>}
    </div>
  );
}

function Avatar() {
  return <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6d82ff] via-[#ff5c9d] to-[#ff9d4d]"><Sparkles className="h-3.5 w-3.5 text-[#fff]" /></span>;
}

function MenuItem({ icon: Icon, label, sub, onClick }: { icon: typeof Copy; label: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-white/5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <span><span className="block text-white">{label}</span>{sub && <span className="block text-xs text-faint">{sub}</span>}</span>
    </button>
  );
}

function BuildingState({ job, thumbnail }: { job: JobState | null; thumbnail?: string | null }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="w-full max-w-xl text-center">
        <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover object-top opacity-40 blur-[1px]" /> : <div className="shimmer h-full w-full" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/5"><div className="h-full w-1/3 animate-[shimmer_1.4s_linear_infinite] bg-gradient-to-r from-transparent via-pink-400 to-transparent" style={{ backgroundSize: "200% 100%" }} /></div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
          {job?.status === "error" ? <span className="text-pink-300">{job.error}</span> : <><Loader2 className="h-4 w-4 animate-spin text-pink-300" /> {job?.steps.at(-1) ?? "Getting ready"}…</>}
        </p>
        <p className="mt-1 text-xs text-faint">Usually takes 1–2 minutes. You can leave this page; we&apos;ll keep working.</p>
      </div>
    </div>
  );
}
