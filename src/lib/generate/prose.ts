import { chatJSON, aiEnabled, type Msg } from "../ai";
import { describeColor, isLight } from "../color";
import type { DesignTokens, Prose } from "../types";

const SYSTEM = `You are a senior product designer writing a DESIGN.md file (Google Stitch DESIGN.md spec, version alpha).
You receive design tokens that were MEASURED from a live website's computed styles, plus a screenshot.
Treat the measured values as ground truth: never invent hex codes, sizes or fonts that are not in the tokens.
Your job is to explain the system so another designer or an AI coding agent can reproduce the look faithfully:
the brand personality, why each color/type level exists, layout rhythm, depth, shape language, component guidance, and guardrails.
Write crisp, specific, confident prose (no fluff, no marketing speak). Use **bold** for named concepts. Keep each section 2-5 sentences.`;

const SHAPE = `Return JSON with exactly these keys:
{
 "name": string (a short evocative design-system name, may include the brand, e.g. "Stripe Luminous"),
 "description": string (one sentence),
 "overview": string,
 "colors": string (intro paragraph for the palette),
 "colorNotes": { "<token name>": "<one sentence on role/usage>" } (one entry per color token given),
 "typography": string,
 "layout": string,
 "elevation": string,
 "shapes": string,
 "components": string,
 "dos": string[] (4-6 items, each starting with "Do "),
 "donts": string[] (3-5 items, each starting with "Don't ")
}`;

export async function writeProse(tokens: DesignTokens, screenshot?: string, sourceUrl?: string): Promise<{ prose: Prose; aiUsed: boolean }> {
  if (aiEnabled()) {
    try {
      const compact = {
        source: sourceUrl,
        name: tokens.name,
        description: tokens.description,
        colors: tokens.colors,
        typography: tokens.typography,
        fonts: tokens.fonts,
        rounded: tokens.rounded,
        spacing: tokens.spacing,
        shadows: tokens.shadows,
        gradients: tokens.gradients,
        components: tokens.components,
        layout: tokens.layout,
      };
      const content: Msg["content"] = [{ type: "text", text: `Measured tokens:\n${JSON.stringify(compact, null, 1)}\n\n${SHAPE}` }];
      if (screenshot) content.push({ type: "image_url", image_url: { url: screenshot, detail: "low" } });
      const prose = await chatJSON<Prose>([{ role: "system", content: SYSTEM }, { role: "user", content }]);
      if (prose.overview && prose.colors) return { prose, aiUsed: true };
    } catch (e) {
      console.error("AI prose failed, using template:", (e as Error).message);
    }
  }
  return { prose: templateProse(tokens), aiUsed: false };
}

/** Deterministic prose so the app works fully without any AI key. */
export function templateProse(t: DesignTokens): Prose {
  const c = t.colors;
  const dark = c.neutral ? !isLight(c.neutral) : false;
  const primaryName = c.primary ? describeColor(c.primary) : "neutral";
  const heading = t.fonts.find((f) => f.role.includes("Head"))?.family ?? t.fonts[0]?.family ?? "a sans-serif";
  const body = t.fonts.find((f) => f.role.includes("ody"))?.family ?? heading;
  const radii = Object.values(t.rounded).map((v) => parseFloat(v)).filter((v) => v < 9999);
  const maxR = radii.length ? Math.max(...radii) : 0;
  const shapeWord = maxR === 0 ? "Sharp, Rectilinear" : maxR <= 6 ? "Crisp, Lightly Softened" : maxR <= 14 ? "Friendly, Rounded" : "Soft, Pillowy";
  const shadowCount = Object.keys(t.shadows).length;

  const notes: Record<string, string> = {};
  const roleText: Record<string, string> = {
    primary: "The core brand color; reserve it for primary actions, links and key highlights.",
    secondary: "A supporting color for secondary emphasis, illustrations and accents.",
    tertiary: "A tertiary accent used sparingly for variety and decorative moments.",
    neutral: "The page background and foundation of every screen.",
    surface: "Raised surfaces such as cards, panels and alternating sections.",
    "on-surface": "Primary text color for headlines and body copy.",
    "on-surface-variant": "Muted text for captions, metadata and secondary copy.",
    outline: "Hairline borders, dividers and input outlines.",
    "on-primary": "Text and icons placed on top of the primary color.",
  };
  for (const [k, v] of Object.entries(c)) notes[k] = `${roleText[k] ?? "An additional accent observed in illustrations and highlights."} (${describeColor(v)})`;

  return {
    name: `${t.name} Design System`,
    description: t.description,
    overview: `${t.name} uses a **${dark ? "dark, immersive" : "light, airy"}** interface anchored by a **${primaryName}** brand color. Typography is set in **${heading}**${body !== heading ? ` with **${body}** for body copy` : ""}, and the overall feel is ${maxR > 10 ? "approachable and modern" : "precise and professional"}. Layouts favor ${t.layout.usesGrid ? "structured grids" : "flexible stacks"} with generous whitespace.`,
    colors: `The palette is built around a ${dark ? "deep, dark" : "clean, light"} neutral foundation with ${c.secondary ? "a small set of accent colors" : "a single accent color"} doing the expressive work.`,
    colorNotes: notes,
    typography: `The type system relies on **${heading}**${body !== heading ? ` for headlines and **${body}** for reading text` : " across headlines and body"}. Headlines use tight line heights for impact, while body text uses comfortable leading for readability. ${Object.keys(t.typography).length} distinct levels were found on the page.`,
    layout: `Spacing follows a **${t.layout.baseUnit}px base unit**${t.layout.maxWidth ? `, and content sits in a centered container of about **${t.layout.maxWidth}**` : ""}. ${t.layout.usesGrid ? "CSS grid is used for multi-column sections" : "Flexbox drives most arrangements"}${t.layout.stickyHeader ? ", with a sticky top navigation" : ""}.`,
    elevation: shadowCount ? `Depth comes from **${shadowCount} soft shadow level${shadowCount > 1 ? "s" : ""}**, used to lift cards and interactive surfaces off the background.` : `The design is largely **flat**: hierarchy is created with tonal contrast, borders and spacing rather than shadows.`,
    shapes: `The shape language is **${shapeWord}**${radii.length ? `, with corner radii ranging up to ${maxR}px` : ""}${t.rounded.full ? " and fully rounded pills for buttons, tags or avatars" : ""}.`,
    components: `Buttons, inputs and cards reuse the palette and radius tokens consistently. Primary buttons use the primary color with high-contrast text; secondary actions are quieter.`,
    dos: [
      "Do use the primary color for the single most important action on a screen",
      `Do keep spacing on the ${t.layout.baseUnit}px grid`,
      `Do pair ${heading} headlines with generous whitespace`,
      "Do maintain WCAG AA contrast (4.5:1) for body text",
    ],
    donts: [
      "Don't introduce new colors outside the palette",
      "Don't mix sharp and rounded corners in the same view",
      "Don't use more than two or three font weights on one screen",
    ],
  };
}
