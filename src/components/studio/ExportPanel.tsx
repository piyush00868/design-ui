"use client";
import { useMemo, useState } from "react";
import { toCssVariables, toDTCG, toTailwindV3, toTailwindV4 } from "@/lib/generate/exports";
import type { DesignTokens } from "@/lib/types";
import { CodeBlock } from "./CodeBlock";

export function ExportPanel({ tokens }: { tokens: DesignTokens }) {
  const tabs = useMemo(() => [
    { id: "tw4", label: "Tailwind v4", file: "globals.css", code: toTailwindV4(tokens), lang: "css" },
    { id: "tw3", label: "Tailwind v3", file: "tailwind.config.js", code: toTailwindV3(tokens), lang: "js" },
    { id: "css", label: "CSS variables", file: "tokens.css", code: toCssVariables(tokens), lang: "css" },
    { id: "json", label: "Design tokens", file: "tokens.json", code: toDTCG(tokens), lang: "W3C DTCG" },
  ], [tokens]);
  const [active, setActive] = useState("tw4");
  const tab = tabs.find((t) => t.id === active)!;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1 text-xs sm:inline-flex">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`rounded-lg px-3 py-1.5 ${active === t.id ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>{t.label}</button>
        ))}
      </div>
      <CodeBlock code={tab.code} filename={tab.file} lang={tab.lang} />
    </div>
  );
}
