"use client";
import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }}
      className={`flex items-center gap-1.5 rounded-lg border border-line-strong bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 ${className}`}
    >
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {ok ? "Copied" : label}
    </button>
  );
}

export function CodeBlock({ code, filename, lang }: { code: string; filename: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0d0d12] code-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-muted">{filename}{lang ? <span className="ml-2 text-faint">{lang}</span> : null}</span>
        <div className="flex gap-2">
          <CopyButton text={code} />
          <button onClick={() => download(filename, code)} className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
      <pre className="scroll-thin max-h-[70vh] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300"><code>{code}</code></pre>
    </div>
  );
}
