"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

export function MarkdownView({ md }: { md: string }) {
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  const body = fm ? md.slice(fm[0].length) : md;
  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-line bg-panel p-1 text-xs">
        {(["rendered", "raw"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 capitalize ${mode === m ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>{m}</button>
        ))}
      </div>
      {mode === "raw" ? (
        <CodeBlock code={md} filename="DESIGN.md" lang="markdown" />
      ) : (
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
          {fm && (
            <details className="mb-6 rounded-xl border border-line bg-black/30">
              <summary className="cursor-pointer px-4 py-2.5 text-xs text-muted">YAML tokens (front matter)</summary>
              <pre className="scroll-thin max-h-80 overflow-auto px-4 pb-4 font-mono text-[12px] text-zinc-300">{fm[1]}</pre>
            </details>
          )}
          <article className="prose dark:prose-invert max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:mt-10 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2 prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.82em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-table:text-sm prose-pre:bg-black/40">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => {
                  const text = String(children);
                  const hex = text.match(/#[0-9A-Fa-f]{6}/)?.[0];
                  return (
                    <strong className="inline-flex items-center gap-1.5">
                      {hex && <span className="inline-block h-3 w-3 rounded-sm border border-white/20" style={{ background: hex }} />}
                      {children}
                    </strong>
                  );
                },
              }}
            >
              {body}
            </ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
}
