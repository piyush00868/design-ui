import { chatJSON, aiEnabled, CODE_MODEL } from "../ai";
import type { DesignTokens, Prose } from "../types";

const SYSTEM = `You are an expert product designer who reverse-engineers design systems from UI screenshots.
Estimate the design tokens as precisely as possible. You are also given colors sampled from the actual pixels,
ranked by area: prefer those exact hex values over guesses when they match what you see.
Identify fonts by visual characteristics and name the closest well-known font (e.g. Inter, Geist, SF Pro, Söhne, Roboto, Playfair Display).
Estimate sizes assuming the screenshot is a ~1440px wide desktop viewport unless it clearly is mobile.`;

const SHAPE = `Return JSON:
{
 "tokens": {
   "name": string, "description": string,
   "colors": { "primary": hex, "secondary"?: hex, "tertiary"?: hex, "neutral": hex, "surface"?: hex, "on-surface": hex, "on-surface-variant"?: hex, "outline"?: hex, "on-primary": hex },
   "typography": { "<level e.g. display|headline-lg|headline-md|title|body-lg|body-md|body-sm|label-md|caption>": { "fontFamily": string, "fontSize": "NNpx", "fontWeight": number, "lineHeight": number, "letterSpacing"?: "N.NNem" } },
   "rounded": { "sm"?: "Npx", "md"?: "Npx", "lg"?: "Npx", "full"?: "9999px" },
   "spacing": { "base": "Npx", "xs": "Npx", "sm": "Npx", "md": "Npx", "lg": "Npx", "xl": "Npx", "2xl": "Npx" },
   "shadows": { "sm"?: css box-shadow, "md"?: css box-shadow },
   "components": { "button-primary": {"backgroundColor": "{colors.primary}", "textColor": "{colors.on-primary}", "rounded": "{rounded.md}", "padding": "12px 20px", "height": "40px"}, "button-secondary"?: {...}, "card"?: {...}, "input-field"?: {...}, "top-nav"?: {...} },
   "fonts": [{ "family": string, "role": "Headings" | "Body" | "Headings & body" | "Monospace", "stack": css font-family stack }],
   "layout": { "maxWidth": "NNNNpx" | null, "baseUnit": 4 | 8, "usesGrid": boolean, "usesFlex": boolean, "stickyHeader": boolean }
 },
 "prose": {
   "name": string, "description": string, "overview": string, "colors": string,
   "colorNotes": { "<color token>": string }, "typography": string, "layout": string,
   "elevation": string, "shapes": string, "components": string,
   "dos": string[4-6, start with "Do "], "donts": string[3-5, start with "Don't "]
 }
}`;

export async function extractFromImage(image: string, palette: string[]): Promise<{ tokens: DesignTokens; prose: Prose }> {
  if (!aiEnabled()) {
    throw new Error("Screenshot analysis needs an AI key (set OPENAI_API_KEY). URL extraction works without one.");
  }
  const res = await chatJSON<{ tokens: Partial<DesignTokens>; prose: Prose }>(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: `Pixel-sampled colors (most area first): ${palette.join(", ") || "n/a"}\n\n${SHAPE}` },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ],
      },
    ],
    { model: CODE_MODEL, maxTokens: 4000 },
  );
  const t = res.tokens;
  const tokens: DesignTokens = {
    name: t.name || "Untitled",
    description: t.description || "Design system reconstructed from a screenshot",
    colors: t.colors || {},
    typography: t.typography || {},
    rounded: t.rounded || {},
    spacing: t.spacing || { base: "8px" },
    shadows: t.shadows || {},
    components: t.components || {},
    fonts: t.fonts || [],
    gradients: [],
    cssVars: [],
    layout: { maxWidth: null, baseUnit: 8, usesGrid: false, usesFlex: true, stickyHeader: false, ...(t.layout || {}) },
  };
  return { tokens, prose: res.prose };
}
