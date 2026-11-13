"use client";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * "Try it before you clone it": a mini site rendered purely from design tokens.
 * Tweaking the controls re-themes it live, the same way an extracted DESIGN.md
 * drives a cloned page.
 */
const SOURCES = {
  stripe: { label: "stripe.com", primary: "#533afd", bg: "#ffffff", fg: "#061b31", muted: "#50617a", font: "Inter", radius: 4, weight: 300, tracking: -0.025 },
  vercel: { label: "vercel.com", primary: "#171717", bg: "#fafafa", fg: "#171717", muted: "#4d4d4d", font: "Geist", radius: 999, weight: 500, tracking: -0.05 },
  notion: { label: "notion.com", primary: "#0075de", bg: "#ffffff", fg: "#1a1a1a", muted: "#5f5e5b", font: "Inter", radius: 8, weight: 700, tracking: -0.02 },
  linear: { label: "linear.app", primary: "#e6e6e6", bg: "#08090a", fg: "#f7f8f8", muted: "#8a8f98", font: "Inter", radius: 6, weight: 510, tracking: -0.022 },
} as const;
type Key = keyof typeof SOURCES;
const FONTS = ["Inter", "Geist", "Playfair Display", "Space Grotesk", "DM Serif Display"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between border border-line-strong px-3 text-[14px]">
      <span className="text-soft">{label}</span>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="group relative flex h-11 cursor-ew-resize items-center justify-between border border-line-strong px-3 text-[14px]">
      <span className="absolute inset-y-0 left-0 bg-white/[0.06]" style={{ width: `${pct}%` }} />
      <span className="absolute inset-y-0 w-[3px] bg-white" style={{ left: `calc(${pct}% - 2px)`, height: "40%", top: "30%" }} />
      <span className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
        {Array.from({ length: 9 }).map((_, i) => <span key={i} className="h-2 w-px bg-white/15" />)}
      </span>
      <span className="relative text-soft">{label}</span>
      <span className="relative font-mono text-[13px] text-white">{fmt(value)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 cursor-ew-resize opacity-0" aria-label={label} />
    </label>
  );
}

export function Playground() {
  const [src, setSrc] = useState<Key>("stripe");
  const base = SOURCES[src];
  const [primary, setPrimary] = useState<string>(base.primary);
  const [font, setFont] = useState<string>(base.font);
  const [radius, setRadius] = useState<number>(Math.min(base.radius, 24));
  const [dark, setDark] = useState(false);
  const [scale, setScale] = useState(1);

  const pick = (k: Key) => {
    const s = SOURCES[k];
    setSrc(k); setPrimary(s.primary); setFont(s.font); setRadius(s.radius > 24 ? 24 : s.radius); setDark(s.bg.toLowerCase() < "#4"); setScale(1);
  };
  const bg = dark ? (base.bg.toLowerCase() < "#4" ? base.bg : "#0e0e10") : base.bg.toLowerCase() < "#4" ? "#ffffff" : base.bg;
  const fg = dark ? "#f2f2f2" : base.bg.toLowerCase() < "#4" ? "#111111" : base.fg;
  const muted = dark ? "#9a9a9f" : base.bg.toLowerCase() < "#4" ? "#55555a" : base.muted;
  const onPrimary = parseInt(primary.slice(1, 3), 16) * 0.299 + parseInt(primary.slice(3, 5), 16) * 0.587 + parseInt(primary.slice(5, 7), 16) * 0.114 > 160 ? "#111" : "#fff";
  const r = radius >= 24 ? 999 : radius;
  const fontUrl = `https://fonts.googleapis.com/css2?family=${FONTS.map((f) => f.replace(/ /g, "+") + ":wght@300;400;500;600;700").join("&family=")}&display=swap`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontUrl} />
      {/* mini site */}
      <div className="reveal relative min-h-[520px] overflow-hidden border border-line-strong bg-[#1b1a1b] p-3 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
          <span className="h-2 w-2 bg-accent" /> Live preview · rebuilt from {base.label} tokens
        </div>
        <div className="h-[calc(100%-28px)] overflow-hidden transition-colors duration-300" style={{ background: bg, color: fg, fontFamily: `"${font}", system-ui, sans-serif` }}>
          <div className="flex items-center justify-between px-6 py-4 text-[13px]" style={{ borderBottom: `1px solid ${fg}14` }}>
            <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 16 }}>Acme</span>
            <div className="hidden gap-5 sm:flex" style={{ color: muted }}><span>Product</span><span>Customers</span><span>Pricing</span></div>
            <span className="px-3 py-1.5 text-[12px] font-medium transition-all duration-300" style={{ background: primary, color: onPrimary, borderRadius: r }}>Sign up</span>
          </div>
          <div className="px-6 pb-8 pt-12 sm:px-10">
            <span className="inline-block px-2.5 py-1 text-[11px] font-medium transition-all duration-300" style={{ background: `${primary}1f`, color: dark ? "#fff" : primary === "#171717" || primary === "#e6e6e6" ? fg : primary, borderRadius: r }}>New · Payments v2</span>
            <h3 className="mt-4 max-w-[520px] transition-all duration-300" style={{ fontSize: 44 * scale, lineHeight: 1.04, fontWeight: base.weight, letterSpacing: `${base.tracking}em` }}>
              Financial infrastructure for the internet
            </h3>
            <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed" style={{ color: muted }}>Millions of companies use Acme to accept payments, send payouts and manage their business online.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="px-4 py-2.5 text-[14px] font-medium transition-all duration-300" style={{ background: primary, color: onPrimary, borderRadius: r }}>Start now →</span>
              <span className="px-4 py-2.5 text-[14px] font-medium transition-all duration-300" style={{ border: `1px solid ${fg}26`, borderRadius: r }}>Contact sales</span>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {["Payments", "Billing", "Connect"].map((t, i) => (
                <div key={t} className="p-4 transition-all duration-300" style={{ background: dark ? "#ffffff0d" : `${fg}06`, borderRadius: Math.min(r, 16), border: `1px solid ${fg}10` }}>
                  <div className="h-7 w-7 transition-all duration-300" style={{ background: i === 0 ? primary : `${fg}1a`, borderRadius: Math.min(r, 8) }} />
                  <div className="mt-3 text-[13px] font-semibold">{t}</div>
                  <div className="mt-1 text-[11px]" style={{ color: muted }}>Global, in one integration.</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="reveal flex flex-col">
        <h2 className="h2 text-[34px] sm:text-[40px]">Try it before you clone it.</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">Pick a site we measured, then change how it looks. Every clone is driven by tokens like these, so restyling takes seconds.</p>
        <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-white hover:text-accent">Clone your own <ArrowRight className="h-3.5 w-3.5" /></Link>

        <div className="mt-8 text-[18px] font-medium">Customize</div>
        <div className="mt-3 space-y-2">
          <Row label="Source">
            <div className="relative">
              <select value={src} onChange={(e) => pick(e.target.value as Key)} className="appearance-none bg-white/[0.06] py-1 pl-2.5 pr-7 text-[13px] text-white outline-none">
                {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k} className="bg-[#1b1a1b]">{v.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </Row>
          <Row label="Brand color">
            <div className="flex items-center gap-1.5">
              {[base.primary, "#fb460d", "#10b981", "#e11d48", "#f59e0b"].map((c, i) => (
                <button key={i} onClick={() => setPrimary(c)} aria-label={`Use ${c}`} className={`h-5 w-5 transition-transform ${primary === c ? "scale-110 outline outline-2 outline-offset-2 outline-white" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </Row>
          <Row label="Typeface">
            <div className="relative">
              <select value={font} onChange={(e) => setFont(e.target.value)} className="appearance-none bg-white/[0.06] py-1 pl-2.5 pr-7 text-[13px] text-white outline-none">
                {FONTS.map((f) => <option key={f} className="bg-[#1b1a1b]">{f}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </Row>
          <Slider label="Corner radius" value={radius} min={0} max={24} step={1} onChange={setRadius} fmt={(v) => (v >= 24 ? "pill" : `${v}px`)} />
          <Slider label="Headline scale" value={scale} min={0.7} max={1.3} step={0.05} onChange={setScale} fmt={(v) => v.toFixed(2)} />
          <Row label="Dark mode">
            <button onClick={() => setDark((d) => !d)} className={`relative h-5 w-9 transition-colors ${dark ? "bg-accent" : "bg-white/15"}`} aria-pressed={dark} aria-label="Toggle dark mode">
              <span className={`absolute top-0.5 h-4 w-4 bg-white transition-all ${dark ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </Row>
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-8">
          <span className="text-[14px] text-muted">Exports to HTML · React · DESIGN.md</span>
          <Link href="/signup" className="btn btn-sm btn-accent">Clone a site</Link>
        </div>
      </div>
    </div>
  );
}
