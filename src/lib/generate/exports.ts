import type { DesignTokens } from "../types";

const resolveRef = (t: DesignTokens, v: string) =>
  v.replace(/\{(colors|rounded|spacing)\.([\w-]+)\}/g, (_, g: "colors" | "rounded" | "spacing", k: string) => (t[g] as Record<string, string>)[k] ?? _);

const fontStack = (t: DesignTokens, family: string) => t.fonts.find((f) => f.family === family)?.stack ?? `"${family}", system-ui, sans-serif`;

export function toCssVariables(t: DesignTokens): string {
  const L = [":root {"];
  L.push("  /* Colors */");
  for (const [k, v] of Object.entries(t.colors)) L.push(`  --color-${k}: ${v};`);
  L.push("", "  /* Fonts */");
  t.fonts.forEach((f) => L.push(`  --font-${slug(f.role)}: ${f.stack};`));
  L.push("", "  /* Type scale */");
  for (const [k, v] of Object.entries(t.typography)) {
    L.push(`  --text-${k}: ${v.fontSize};`, `  --text-${k}--line-height: ${v.lineHeight};`, `  --text-${k}--font-weight: ${v.fontWeight};`);
    if (v.letterSpacing) L.push(`  --text-${k}--letter-spacing: ${v.letterSpacing};`);
  }
  L.push("", "  /* Spacing */");
  for (const [k, v] of Object.entries(t.spacing)) L.push(`  --space-${k}: ${v};`);
  L.push("", "  /* Radius */");
  for (const [k, v] of Object.entries(t.rounded)) L.push(`  --radius-${k}: ${v};`);
  if (Object.keys(t.shadows).length) {
    L.push("", "  /* Shadows */");
    for (const [k, v] of Object.entries(t.shadows)) L.push(`  --shadow-${k}: ${v};`);
  }
  L.push("}");

  // typography utility classes
  L.push("");
  for (const [k, v] of Object.entries(t.typography)) {
    L.push(`.text-${k} {`, `  font-family: ${fontStack(t, v.fontFamily)};`, `  font-size: var(--text-${k});`, `  font-weight: ${v.fontWeight};`, `  line-height: ${v.lineHeight};`);
    if (v.letterSpacing) L.push(`  letter-spacing: ${v.letterSpacing};`);
    if (v.textTransform) L.push(`  text-transform: ${v.textTransform};`);
    L.push("}");
  }
  return L.join("\n");
}

/** Tailwind CSS v4 (CSS-first config). */
export function toTailwindV4(t: DesignTokens): string {
  const L = ['@import "tailwindcss";', "", "@theme {"];
  for (const [k, v] of Object.entries(t.colors)) L.push(`  --color-${k}: ${v};`);
  L.push("");
  t.fonts.forEach((f) => L.push(`  --font-${slug(f.role)}: ${f.stack};`));
  L.push("");
  for (const [k, v] of Object.entries(t.typography)) {
    L.push(`  --text-${k}: ${v.fontSize};`, `  --text-${k}--line-height: ${v.lineHeight};`, `  --text-${k}--font-weight: ${v.fontWeight};`);
    if (v.letterSpacing) L.push(`  --text-${k}--letter-spacing: ${v.letterSpacing};`);
  }
  L.push("");
  for (const [k, v] of Object.entries(t.rounded)) L.push(`  --radius-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.shadows)) L.push(`  --shadow-${k}: ${v};`);
  L.push(`  --spacing: ${t.spacing.base ?? "4px"};`);
  L.push("}");
  return L.join("\n");
}

/** Tailwind CSS v3 (tailwind.config.js). */
export function toTailwindV3(t: DesignTokens): string {
  const fontSize: Record<string, [string, Record<string, string | number>]> = {};
  for (const [k, v] of Object.entries(t.typography)) {
    fontSize[k] = [v.fontSize, { lineHeight: String(v.lineHeight), fontWeight: String(v.fontWeight), ...(v.letterSpacing ? { letterSpacing: v.letterSpacing } : {}) }];
  }
  const fontFamily: Record<string, string[]> = {};
  t.fonts.forEach((f) => (fontFamily[slug(f.role)] = f.stack.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))));
  const spacing = Object.fromEntries(Object.entries(t.spacing).filter(([k]) => k !== "base"));
  const config = {
    theme: { extend: { colors: t.colors, fontFamily, fontSize, borderRadius: t.rounded, spacing, boxShadow: t.shadows } },
  };
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)};\n`;
}

/** W3C Design Tokens Community Group format (works with Style Dictionary, Figma Tokens Studio). */
export function toDTCG(t: DesignTokens): string {
  const out: Record<string, unknown> = {
    color: Object.fromEntries(Object.entries(t.colors).map(([k, v]) => [k, { $type: "color", $value: v }])),
    typography: Object.fromEntries(
      Object.entries(t.typography).map(([k, v]) => [k, {
        $type: "typography",
        $value: { fontFamily: v.fontFamily, fontSize: v.fontSize, fontWeight: v.fontWeight, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing ?? "0em" },
      }]),
    ),
    dimension: {
      radius: Object.fromEntries(Object.entries(t.rounded).map(([k, v]) => [k, { $type: "dimension", $value: v }])),
      spacing: Object.fromEntries(Object.entries(t.spacing).map(([k, v]) => [k, { $type: "dimension", $value: v }])),
    },
    shadow: Object.fromEntries(Object.entries(t.shadows).map(([k, v]) => [k, { $type: "shadow", $value: v }])),
  };
  return JSON.stringify(out, null, 2);
}

export function resolvedComponent(t: DesignTokens, name: string): Record<string, string> {
  const c = t.components[name];
  if (!c) return {};
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, resolveRef(t, v)]));
}

function slug(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
