"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, FileStack, Globe, Loader2, Trash2 } from "lucide-react";

type P = { id: string; name: string; source_url: string | null; favicon: string | null; thumbnail: string | null; status: string; updated_at: string; page_count: number };

function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ProjectGrid({ initial }: { initial: P[] }) {
  const [items, setItems] = useState(initial);
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-line-strong p-12 text-center text-sm text-faint">No projects yet. Paste a URL above to clone your first website.</div>;
  }
  const remove = async (id: string) => {
    if (!confirm("Delete this project and all its versions?")) return;
    setItems((x) => x.filter((p) => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-line bg-panel transition hover:-translate-y-0.5 hover:border-line-strong">
          <Link href={`/project/${p.id}`}>
            <div className="relative aspect-[16/10] overflow-hidden bg-panel-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.thumbnail ? <img src={p.thumbnail} alt="" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" /> : <div className="shimmer h-full w-full" />}
              {p.status !== "ready" && (
                <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs backdrop-blur ${p.status === "error" ? "bg-pink-500/20 text-pink-200" : "bg-black/60 text-white"}`}>
                  {p.status === "error" ? <AlertCircle className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}{p.status === "error" ? "Failed" : "Cloning"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.favicon ? <img src={p.favicon} alt="" className="h-4 w-4" /> : <Globe className="h-4 w-4 text-faint" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{p.name}</div>
                <div className="flex items-center gap-2 text-xs text-faint">
                  <span>{ago(p.updated_at)}</span>
                  <span className="flex items-center gap-1"><FileStack className="h-3 w-3" />{p.page_count} page{p.page_count === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>
          </Link>
          <button onClick={() => remove(p.id)} className="absolute right-2 top-2 hidden rounded-lg bg-black/60 p-1.5 text-white/70 backdrop-blur hover:text-white group-hover:block" aria-label="Delete project">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
