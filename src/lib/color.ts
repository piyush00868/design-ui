// Small, dependency-free color utilities: parsing, conversion, contrast, distance.

export type RGBA = { r: number; g: number; b: number; a: number };

export function parseColor(input: string): RGBA | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (s === "transparent" || s === "none") return null;

  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p)));
    let a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    if (parts[3]?.endsWith("%")) a = parseFloat(parts[3]) / 100;
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a };
  }

  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // color(srgb r g b / a) produced by some browsers for wide-gamut values
  const srgb = s.match(/^color\(srgb\s+([^)]+)\)$/);
  if (srgb) {
    const parts = srgb[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
    if (parts.length >= 3) return { r: parts[0] * 255, g: parts[1] * 255, b: parts[2] * 255, a: parts[3] ?? 1 };
  }
  return null;
}

const h2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

export function toHex(c: RGBA, keepAlpha = false): string {
  const base = `#${h2(c.r)}${h2(c.g)}${h2(c.b)}`.toUpperCase();
  if (keepAlpha && c.a < 1) return base + h2(c.a * 255).toUpperCase();
  return base;
}

/** Composite a translucent color over a backdrop (defaults to white). */
export function flatten(c: RGBA, over: RGBA = { r: 255, g: 255, b: 255, a: 1 }): RGBA {
  const a = c.a;
  return { r: c.r * a + over.r * (1 - a), g: c.g * a + over.g * (1 - a), b: c.b * a + over.b * (1 - a), a: 1 };
}

function lin(v: number) {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminance(c: RGBA) {
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function contrast(a: RGBA, b: RGBA) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function toLab(c: RGBA) {
  const r = lin(c.r), g = lin(c.g), b = lin(c.b);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

export function deltaE(a: RGBA, b: RGBA) {
  const A = toLab(a), B = toLab(b);
  return Math.sqrt((A.L - B.L) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2);
}

/** Perceptual colorfulness (Lab chroma). Greys are ~0, vivid brand colors 40+. */
export function chroma(c: RGBA) {
  const { a, b } = toLab(c);
  return Math.sqrt(a * a + b * b);
}

export function toHsl(c: RGBA) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

/** Human-friendly descriptive name for a color, used in prose fallbacks. */
export function describeColor(hex: string): string {
  const c = parseColor(hex);
  if (!c) return "color";
  const { h, s, l } = toHsl(c);
  if (s < 0.1) {
    if (l > 0.96) return "white";
    if (l > 0.85) return "off-white";
    if (l > 0.6) return "light gray";
    if (l > 0.35) return "mid gray";
    if (l > 0.12) return "charcoal";
    return "near-black";
  }
  const tone = l > 0.8 ? "pale " : l > 0.62 ? "light " : l < 0.25 ? "deep " : l < 0.4 ? "dark " : s > 0.7 ? "vivid " : "";
  const names: [number, string][] = [
    [15, "red"], [40, "orange"], [60, "amber"], [75, "yellow"], [150, "green"], [180, "teal"],
    [200, "cyan"], [235, "blue"], [260, "indigo"], [290, "violet"], [330, "magenta"], [360, "red"],
  ];
  const name = names.find(([max]) => h <= max)?.[1] ?? "red";
  return `${tone}${name}`;
}

export function isLight(hex: string) {
  const c = parseColor(hex);
  return c ? luminance(c) > 0.45 : true;
}
