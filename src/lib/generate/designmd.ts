import YAML from "yaml";
import type { DesignTokens, Prose } from "../types";

/**
 * Builds a DESIGN.md that follows the Google Stitch DESIGN.md spec (alpha):
 * YAML front matter with tokens, then ordered H2 sections:
 * Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
 */
export function buildDesignMd(t: DesignTokens, p: Prose, sourceUrl?: string): string {
  const typography: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(t.typography)) {
    const { textTransform: _tt, ...rest } = v;
    void _tt;
    typography[k] = rest;
  }
  const spacing: Record<string, string> = { ...t.spacing };

  const front: Record<string, unknown> = {
    version: "alpha",
    name: p.name || t.name,
    description: p.description || t.description,
    colors: t.colors,
    typography,
    rounded: t.rounded,
    spacing,
    components: t.components,
  };
  const yaml = YAML.stringify(front, { lineWidth: 0, defaultStringType: "PLAIN", defaultKeyType: "PLAIN" })
    // hex colors must be quoted or YAML treats '#' as a comment
    .replace(/: (#[0-9A-Fa-f]{3,8})$/gm, ': "$1"');

  const L: string[] = [];
  L.push("---", yaml.trimEnd(), "---", "");
  L.push(`# ${p.name || t.name}`, "");
  if (sourceUrl) L.push(`> Extracted from [${sourceUrl}](${sourceUrl}) by measuring the live page's computed styles.`, "");

  L.push("## Overview", "", p.overview, "");

  L.push("## Colors", "", p.colors, "");
  for (const [k, v] of Object.entries(t.colors)) {
    const note = p.colorNotes?.[k];
    L.push(`- **${title(k)} (${v}):** ${note ?? ""}`.trimEnd());
  }
  if (t.gradients.length) {
    L.push("", "Signature gradients observed on the page:", "", "```css");
    t.gradients.forEach((g, i) => L.push(`--gradient-${i + 1}: ${g};`));
    L.push("```");
  }
  L.push("");

  L.push("## Typography", "", p.typography, "");
  if (t.fonts.length) {
    for (const f of t.fonts) L.push(`- **${f.role}:** ${f.family} \`${f.stack}\``);
    L.push("");
  }
  L.push("| Level | Font | Size | Weight | Line height | Letter spacing |", "| --- | --- | --- | --- | --- | --- |");
  for (const [k, v] of Object.entries(t.typography)) {
    L.push(`| ${k} | ${v.fontFamily} | ${v.fontSize} | ${v.fontWeight} | ${v.lineHeight} | ${v.letterSpacing ?? "0"}${v.textTransform ? ` (${v.textTransform})` : ""} |`);
  }
  L.push("");

  L.push("## Layout", "", p.layout, "");
  L.push(`- **Base unit:** ${t.layout.baseUnit}px`);
  if (t.layout.maxWidth) L.push(`- **Content max width:** ${t.layout.maxWidth}`);
  L.push(`- **Spacing scale:** ${Object.entries(t.spacing).filter(([k]) => k !== "base" && k !== "container").map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  L.push(`- **Layout primitives:** ${[t.layout.usesGrid && "CSS Grid", t.layout.usesFlex && "Flexbox", t.layout.stickyHeader && "sticky header"].filter(Boolean).join(", ") || "block flow"}`, "");

  L.push("## Elevation & Depth", "", p.elevation, "");
  if (Object.keys(t.shadows).length) {
    L.push("```css");
    for (const [k, v] of Object.entries(t.shadows)) L.push(`--shadow-${k}: ${v};`);
    L.push("```", "");
  }

  L.push("## Shapes", "", p.shapes, "");
  L.push(Object.entries(t.rounded).map(([k, v]) => `- **${k}:** ${v}`).join("\n"), "");

  L.push("## Components", "", p.components, "");
  for (const [name, props] of Object.entries(t.components)) {
    L.push(`- **${title(name)}:** ${Object.entries(props).map(([k, v]) => `${k} \`${v}\``).join(", ")}`);
  }
  L.push("");

  L.push("## Do's and Don'ts", "");
  for (const d of p.dos) L.push(`- ${d}`);
  for (const d of p.donts) L.push(`- ${d}`);
  L.push("");
  return L.join("\n");
}

function title(s: string) {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
