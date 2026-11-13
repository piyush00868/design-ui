"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { loadHistory, removeFromHistory } from "@/lib/client/history";
import type { ExtractionResult } from "@/lib/types";

export function RecentGrid() {
  const [items, setItems] = useState<ExtractionResult[]>([]);
  useEffect(() => setItems(loadHistory()), []);
  if (!items.length) return null;
  return (
    <section className="relative z-10 mx-auto mt-24 max-w-6xl px-5">
      <h2 className="mb-4 text-sm font-medium text-muted">Your recent extractions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 8).map((r) => (
          <div key={r.id} className="group relative overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-line-strong">
            <Link href={`/studio?id=${r.id}`}>
              <div className="aspect-[16/10] overflow-hidden bg-panel-2">
                {r.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.screenshot} alt="" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="grid h-full place-items-center text-faint"><ImageIcon /></div>
                )}
              </div>
              <div className="flex items-center gap-2 p-3">
                <div className="flex -space-x-1">
                  {Object.values(r.tokens.colors).slice(0, 4).map((c, i) => (
                    <span key={i} className="h-4 w-4 rounded-full border border-black/40" style={{ background: c }} />
                  ))}
                </div>
                <span className="truncate text-sm text-white">{r.source.url ? new URL(r.source.url).hostname.replace(/^www\./, "") : r.tokens.name}</span>
              </div>
            </Link>
            <button
              onClick={() => { removeFromHistory(r.id); setItems(loadHistory()); }}
              className="absolute right-2 top-2 hidden rounded-md bg-black/60 p-1.5 text-white/70 hover:text-white group-hover:block"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
