"use client";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { contrast, parseColor } from "@/lib/color";
import { resolvedComponent } from "@/lib/generate/exports";
import type { DesignTokens } from "@/lib/types";

/** Try loading each detected family from Google Fonts so specimens render in the real font when possible. */
function useGoogleFonts(families: string[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    for (const raw of families) {
      const f = raw.replace(/\s*(Variable|VF|var)$/i, "").trim();
      if (!f || /^(system-ui|-apple-system|sans-serif|serif|monospace)$/i.test(f)) continue;
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(l);
      links.push(l);
    }
    return () => links.forEach((l) => l.remove());
  }, [families.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
}

const stackFor = (t: DesignTokens, family: string) => {
  const clean = family.replace(/\s*(Variable|VF|var)$/i, "").trim();
  const stack = t.fonts.find((f) => f.family === family)?.stack ?? "system-ui, sans-serif";
  return `"${family}", "${clean}", ${stack}`;
};

function Swatch({ name, hex, bg }: { name: string; hex: string; bg: string }) {
  const [copied, setCopied] = useState(false);
  const c = parseColor(hex);
  const b = parseColor(bg);
  const ratio = c && b ? contrast(c, b) : 0;
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="group overflow-hidden rounded-xl border border-line bg-panel text-left transition hover:border-line-strong"
    >
      <div className="relative h-20" style={{ background: hex }}>
        <span className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
      </div>
      <div className="p-2.5">
        <div className="truncate text-xs font-medium text-white">{name}</div>
        <div className="mt-0.5 flex items-center justify-between font-mono text-[11px] text-faint">
          <span>{hex}</span>
          {name !== "neutral" && ratio > 0 && <span title="Contrast vs. background">{ratio.toFixed(1)}:1</span>}
        </div>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fade-up">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">{title}</h3>
      {children}
    </section>
  );
}

export function StyleGuide({ tokens: t, screenshot }: { tokens: DesignTokens; screenshot?: string }) {
  useGoogleFonts(t.fonts.map((f) => f.family));
  const bg = t.colors.neutral ?? "#ffffff";
  const fg = t.colors["on-surface"] ?? "#111111";
  const muted = t.colors["on-surface-variant"] ?? fg;
  const surface = t.colors.surface ?? bg;
  const outline = t.colors.outline ?? "rgba(127,127,127,0.25)";
  const btn = resolvedComponent(t, "button-primary");
  const btn2 = resolvedComponent(t, "button-secondary");
  const card = resolvedComponent(t, "card");
  const input = resolvedComponent(t, "input-field");
  const headFont = t.typography["display"]?.fontFamily ?? t.typography["headline-lg"]?.fontFamily ?? t.fonts[0]?.family ?? "system-ui";
  const bodyT = t.typography["body-md"] ?? Object.values(t.typography)[0];
  const radius = (v?: string) => (v && v !== "transparent" ? v : t.rounded.md ?? t.rounded.sm ?? "8px");

  return (
    <div className="space-y-10">
      {/* live mini-mockup rendered purely from tokens */}
      <Section title="Rendered from tokens">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-line" style={{ background: bg, color: fg, fontFamily: bodyT ? stackFor(t, bodyT.fontFamily) : undefined }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${outline}` }}>
              <span style={{ fontFamily: stackFor(t, headFont), fontWeight: 600 }}>{t.name}</span>
              <div className="flex gap-4 text-sm" style={{ color: muted }}>
                <span>Product</span><span>Pricing</span><span>Docs</span>
              </div>
            </div>
            <div className="px-6 py-10">
              <div style={{ fontFamily: stackFor(t, headFont), fontSize: "clamp(28px, 3.2vw, 40px)", fontWeight: t.typography["headline-lg"]?.fontWeight ?? 600, lineHeight: 1.1, letterSpacing: t.typography["headline-lg"]?.letterSpacing }}>
                Build something people love
              </div>
              <p className="mt-3 max-w-md" style={{ color: muted, fontSize: bodyT?.fontSize, lineHeight: bodyT?.lineHeight }}>
                This preview is generated entirely from the extracted tokens: palette, type, radius and components.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button style={{ background: btn.backgroundColor ?? t.colors.primary, color: btn.textColor ?? t.colors["on-primary"], borderRadius: radius(btn.rounded), padding: btn.padding ?? "10px 18px", fontWeight: 500, fontSize: 14, border: btn.border }}>
                  Get started
                </button>
                <button style={{ background: btn2.backgroundColor ?? "transparent", color: btn2.textColor ?? fg, borderRadius: radius(btn2.rounded ?? btn.rounded), padding: btn2.padding ?? "10px 18px", fontWeight: 500, fontSize: 14, border: btn2.border ?? `1px solid ${outline}` }}>
                  Learn more
                </button>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["Fast", "Reliable"].map((k) => (
                  <div key={k} style={{ background: card.backgroundColor && card.backgroundColor !== "transparent" ? card.backgroundColor : surface, borderRadius: radius(card.rounded), border: card.border ?? `1px solid ${outline}`, boxShadow: t.shadows.md ?? t.shadows.sm, padding: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: t.rounded.sm ?? 6, background: t.colors.primary, opacity: 0.9 }} />
                    <div className="mt-3 text-sm font-semibold">{k}</div>
                    <div className="mt-1 text-xs" style={{ color: muted }}>Consistent tokens everywhere.</div>
                  </div>
                ))}
              </div>
              <input readOnly placeholder="you@example.com" className="mt-6 w-full max-w-xs text-sm outline-none"
                style={{ background: input.backgroundColor && input.backgroundColor !== "transparent" ? input.backgroundColor : bg, color: fg, borderRadius: radius(input.rounded), padding: "10px 12px", border: input.border ?? `1px solid ${outline}` }} />
            </div>
          </div>
          {screenshot && (
            <div className="overflow-hidden rounded-2xl border border-line bg-panel">
              <div className="border-b border-line px-4 py-2 text-xs text-faint">Original</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshot} alt="Original screenshot" className="w-full" />
            </div>
          )}
        </div>
      </Section>

      <Section title={`Colors · ${Object.keys(t.colors).length}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Object.entries(t.colors).map(([k, v]) => <Swatch key={k} name={k} hex={v} bg={bg} />)}
        </div>
        {t.gradients.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {t.gradients.map((g, i) => <div key={i} className="h-16 rounded-xl border border-line" style={{ background: g }} title={g} />)}
          </div>
        )}
      </Section>

      <Section title="Typography">
        <div className="mb-3 flex flex-wrap gap-2">
          {t.fonts.map((f) => (
            <span key={f.family} className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted">
              <span className="text-white">{f.family}</span> · {f.role}
            </span>
          ))}
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line" style={{ background: bg, color: fg }}>
          {Object.entries(t.typography).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-6 px-5 py-4">
              <div className="w-28 shrink-0 font-mono text-[11px]" style={{ color: muted }}>
                <div style={{ color: fg }}>{k}</div>
                <div>{v.fontSize} / {v.fontWeight} / {v.lineHeight}</div>
              </div>
              <div className="min-w-0 truncate" style={{ fontFamily: stackFor(t, v.fontFamily), fontSize: `min(${v.fontSize}, 56px)`, fontWeight: v.fontWeight, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing, textTransform: (v.textTransform as React.CSSProperties["textTransform"]) ?? undefined }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-10 lg:grid-cols-3">
        <Section title="Spacing">
          <div className="space-y-2 rounded-2xl border border-line bg-panel p-4">
            {Object.entries(t.spacing).filter(([k]) => k !== "container").map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-mono text-faint">{k}</span>
                <span className="h-3 rounded-sm bg-gradient-to-r from-[#6d82ff] to-[#ff5c9d]" style={{ width: `min(${v}, 100%)` }} />
                <span className="font-mono text-muted">{v}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Radius">
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-panel p-4">
            {Object.entries(t.rounded).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="mx-auto h-14 w-14 border-2 border-white/60 bg-white/5" style={{ borderRadius: v }} />
                <div className="mt-2 font-mono text-[11px] text-faint">{k} · {v === "9999px" ? "full" : v}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Elevation">
          <div className="grid grid-cols-3 gap-4 rounded-2xl p-4" style={{ background: bg }}>
            {Object.keys(t.shadows).length ? Object.entries(t.shadows).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="mx-auto h-14 w-14 rounded-lg" style={{ boxShadow: v, background: surface }} />
                <div className="mt-2 font-mono text-[11px]" style={{ color: muted }}>{k}</div>
              </div>
            )) : <div className="col-span-3 py-4 text-center text-xs" style={{ color: muted }}>Flat design · no shadows</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}
