"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const TOOLS = [
  { id: "cursor", label: "Cursor", file: ".cursor/rules/design.md", how: "Drop the DESIGN.md into your rules folder. Every component Cursor writes follows the cloned palette, type scale and spacing." },
  { id: "claude", label: "Claude Code", file: "DESIGN.md", how: "Put DESIGN.md in your repo root and mention it once. Claude Code reads the tokens and builds on-brand screens." },
  { id: "v0", label: "v0 / Lovable", file: "prompt", how: "Paste the DESIGN.md at the top of your prompt. The generated UI starts from a real design system instead of a generic one." },
];

const SNIPPET = `---
version: alpha
name: Stripe Luminous
colors:
  primary: "#533AFD"
  on-surface: "#061B31"
typography:
  display: { fontFamily: sohne-var, fontSize: 56px, fontWeight: 300 }
rounded: { sm: 4px, full: 9999px }
---`;

export function Agents() {
  const [tool, setTool] = useState(TOOLS[0]);
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid items-center gap-16 lg:grid-cols-2">
      <div className="reveal">
        <h2 className="h2 text-[34px] sm:text-[40px]">Made for<br />agentic coding.</h2>
        <div className="mt-8 inline-flex bg-white/[0.06]">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => setTool(t)} className={`px-4 py-3 text-[14px] transition-colors ${tool.id === t.id ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>{t.label}</button>
          ))}
        </div>
        <p className="mt-6 max-w-[520px] text-[18px] leading-relaxed text-muted">{tool.how}</p>
        <div className="mt-6 max-w-[520px] border border-line-strong bg-[#0f0e0f] code-surface">
          <div className="flex items-center justify-between border-b border-line-strong px-4 py-2 font-mono text-[12px] text-muted">
            {tool.file}
            <button onClick={() => { navigator.clipboard.writeText(SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="flex items-center gap-1.5 text-white hover:text-accent">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-soft">{SNIPPET}</pre>
        </div>
      </div>
      <div className="reveal relative mx-auto aspect-square w-full max-w-[520px]">
        <div className="absolute inset-0 rounded-full border border-line-strong" />
        <div className="orb absolute inset-[12%] rounded-full" />
        <span className="absolute left-1/2 top-[-14px] -translate-x-1/2 bg-ink px-2 text-[14px] text-white">✳ Claude Code</span>
        <span className="absolute left-1/2 top-[-2px] h-2 w-2 -translate-x-1/2 bg-accent" />
        <span className="absolute left-[-6%] top-1/2 -translate-y-1/2 bg-ink px-2 text-[14px] text-muted">Cursor</span>
        <span className="absolute right-[-6%] top-1/2 -translate-y-1/2 bg-ink px-2 text-[14px] text-muted">v0</span>
        <span className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 bg-ink px-2 text-[14px] text-muted">Lovable</span>
      </div>
    </div>
  );
}
