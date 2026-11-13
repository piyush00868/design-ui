"use client";
import { useCallback, useRef, useState } from "react";
import type { DesignTokens, ExtractionResult } from "../types";
import { saveToHistory } from "./history";

export type Step = { message: string; at: number };
export type Status = "idle" | "running" | "done" | "error";

export function useExtraction() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [partial, setPartial] = useState<{ tokens: DesignTokens; screenshot?: string } | null>(null);
  const started = useRef(false);

  const run = useCallback(async (payload: { url?: string; image?: string; palette?: string[] }) => {
    if (started.current) return;
    started.current = true;
    setStatus("running"); setSteps([]); setError(null); setResult(null); setPartial(null);
    try {
      const res = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(j.error);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "step") setSteps((s) => [...s, { message: ev.message, at: Date.now() }]);
          else if (ev.type === "tokens") setPartial({ tokens: ev.tokens, screenshot: ev.screenshot });
          else if (ev.type === "result") {
            const r = ev.data as ExtractionResult;
            if (payload.image && !r.screenshot) r.screenshot = payload.image;
            setResult(r); saveToHistory(r); setStatus("done");
          } else if (ev.type === "error") throw new Error(ev.message);
        }
      }
    } catch (e) {
      setError((e as Error).message); setStatus("error");
      started.current = false;
    }
  }, []);

  const reset = useCallback(() => { started.current = false; }, []);
  return { steps, status, error, result, partial, run, setResult, setStatus, reset };
}
