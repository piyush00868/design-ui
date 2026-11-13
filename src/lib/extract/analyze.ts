import { chroma, contrast, deltaE, flatten, parseColor, toHex, type RGBA } from "../color";
import type { ComponentSample, DesignTokens, RawStyles, TypographyToken } from "../types";

type Cluster = { rgb: RGBA; hex: string; text: number; bg: number; border: number; button: number; link: number };

const total = (c: Cluster) => c.text + c.bg + c.border;

function clusterColors(raw: RawStyles, page: RGBA): Cluster[] {
  const clusters: Cluster[] = [];
  const entries = raw.colors
    .map((c) => ({ ...c, rgb: parseColor(c.value) }))
    .filter((c) => c.rgb && c.rgb.a > 0.05)
    .map((c) => ({ ...c, rgb: c.rgb!.a < 1 ? flatten(c.rgb!, page) : c.rgb! }))
    .sort((a, b) => b.text + b.bg + b.border - (a.text + a.bg + a.border));

  for (const e of entries) {
    const near = clusters.find((c) => deltaE(c.rgb, e.rgb) < 5);
    if (near) {
      near.text += e.text; near.bg += e.bg; near.border += e.border;
    } else {
      clusters.push({ rgb: e.rgb, hex: toHex(e.rgb), text: e.text, bg: e.bg, border: e.border, button: 0, link: 0 });
    }
  }
  return clusters;
}

function findCluster(clusters: Cluster[], color: string, page: RGBA) {
  const c = parseColor(color);
  if (!c || c.a < 0.05) return null;
  const flat = c.a < 1 ? flatten(c, page) : c;
  let best: Cluster | null = null;
  let bestD = 8;
  for (const cl of clusters) {
    const d = deltaE(cl.rgb, flat);
    if (d < bestD) { bestD = d; best = cl; }
  }
  return best;
}

const isTransparent = (c: string) => { const p = parseColor(c); return !p || p.a < 0.05; };

function pickPrimaryButton(buttons: ComponentSample[], page: RGBA) {
  const filled = buttons.filter((b) => {
    const bg = parseColor(b.bg);
    return bg && bg.a > 0.5 && contrast(flatten(bg, page), page) > 1.25;
  });
  if (!filled.length) return null;
  // group by background, prefer the most chromatic group that appears most often
  const groups = new Map<string, ComponentSample[]>();
  for (const b of filled) {
    const key = toHex(flatten(parseColor(b.bg)!, page));
    groups.set(key, [...(groups.get(key) || []), b]);
  }
  const ranked = [...groups.entries()].sort((a, b) => {
    const score = (g: [string, ComponentSample[]]) => g[1].length * (1 + chroma(parseColor(g[0])!) / 40);
    return score(b) - score(a);
  });
  return ranked[0][1][0];
}

function pickSecondaryButton(buttons: ComponentSample[], primary: ComponentSample | null, page: RGBA) {
  return (
    buttons.find((b) => b !== primary && isTransparent(b.bg) && b.borderWidth > 0) ||
    buttons.find((b) => {
      if (b === primary) return false;
      const bg = parseColor(b.bg);
      if (!bg || bg.a < 0.05) return false;
      return !primary || deltaE(flatten(bg, page), flatten(parseColor(primary.bg)!, page)) > 10;
    }) ||
    null
  );
}

function round(n: number, step = 1) {
  return Math.round(n / step) * step;
}

function brandFromMeta(raw: RawStyles) {
  const host = (() => { try { return new URL(raw.meta.url).hostname.replace(/^www\./, ""); } catch { return "site"; } })();
  const hostRoot = host.split(".").slice(-2, -1)[0] || host;
  const parts = (raw.meta.title || "").split(/\s[|\-–—:·]\s/).map((s) => s.trim()).filter(Boolean);
  const match = parts.find((p) => p.toLowerCase().replace(/\s/g, "").includes(hostRoot.toLowerCase()));
  const pick = match || (parts.length > 1 ? parts.sort((a, b) => a.length - b.length)[0] : null);
  if (pick && pick.length <= 32) return pick;
  return hostRoot.charAt(0).toUpperCase() + hostRoot.slice(1);
}

export function analyze(raw: RawStyles): DesignTokens {
  const page = parseColor(raw.bodyBg) ?? { r: 255, g: 255, b: 255, a: 1 };
  const pageRgb = page.a < 1 ? flatten(page) : page;
  const clusters = clusterColors(raw, pageRgb);

  // usage boosts from components
  const primaryBtn = pickPrimaryButton(raw.components.buttons, pageRgb);
  const secondaryBtn = pickSecondaryButton(raw.components.buttons, primaryBtn, pageRgb);
  for (const b of raw.components.buttons) {
    const cl = findCluster(clusters, b.bg, pageRgb);
    if (cl) cl.button += 1;
  }
  for (const l of raw.components.links) {
    const cl = findCluster(clusters, l.color, pageRgb);
    if (cl) cl.link += 1;
  }

  const used = new Set<Cluster>();
  const take = (c: Cluster | null | undefined) => { if (c) used.add(c); return c ?? null; };
  const distinct = (c: Cluster, min = 6) => [...used].every((u) => deltaE(u.rgb, c.rgb) >= min);

  const colors: Record<string, string> = {};
  const neutral = take(findCluster(clusters, raw.bodyBg, pageRgb)) ?? { hex: toHex(pageRgb), rgb: pageRgb } as Cluster;
  const isDark = contrast(pageRgb, { r: 0, g: 0, b: 0, a: 1 }) < 7;

  // ACCENTS: chromatic colors ranked by how they're used
  const accents = clusters
    .filter((c) => chroma(c.rgb) > 18 && !used.has(c))
    .map((c) => ({ c, score: c.bg * 0.6 + c.text * 0.8 + c.border * 0.3 + c.button * 400 + c.link * 120 }))
    .sort((a, b) => b.score - a.score);

  const primaryBtnCluster = primaryBtn ? findCluster(clusters, primaryBtn.bg, pageRgb) : null;
  let primary: Cluster | null = null;
  if (primaryBtnCluster && chroma(primaryBtnCluster.rgb) > 18) primary = primaryBtnCluster;
  else if (accents[0] && accents[0].score > 60) primary = accents[0].c;
  else if (primaryBtnCluster) primary = primaryBtnCluster; // monochrome brand (e.g. black buttons)

  const textClusters = clusters.filter((c) => c.text > 0).sort((a, b) => b.text - a.text);
  const onSurface = textClusters.find((c) => c !== primary && chroma(c.rgb) < 25) ?? textClusters[0];
  if (!primary) primary = onSurface ?? null;

  take(primary);
  if (primary) colors.primary = primary.hex;

  const rest = accents.filter((a) => !used.has(a.c) && distinct(a.c, 14) && a.score > 20);
  const secondary = rest[0]?.c;
  if (secondary) { take(secondary); colors.secondary = secondary.hex; }
  const tertiary = accents.find((a) => !used.has(a.c) && distinct(a.c, 14) && a.score > 20)?.c;
  if (tertiary) { take(tertiary); colors.tertiary = tertiary.hex; }

  colors.neutral = neutral.hex;

  const surface = clusters
    .filter((c) => c.bg > 0 && chroma(c.rgb) < 20 && c !== neutral && !used.has(c) && deltaE(c.rgb, neutral.rgb) > 2.5)
    .sort((a, b) => b.bg - a.bg)[0];
  if (surface && surface.bg > 30) { take(surface); colors.surface = surface.hex; }

  let mainText = onSurface;
  let variant = textClusters.find((c) => !used.has(c) && c !== onSurface && chroma(c.rgb) < 25 && onSurface && deltaE(c.rgb, onSurface.rgb) > 8);
  // the higher-contrast of the two main text greys is the primary text color
  if (mainText && variant && contrast(variant.rgb, pageRgb) > contrast(mainText.rgb, pageRgb) && variant.text > mainText.text * 0.25) {
    [mainText, variant] = [variant, mainText];
  }
  if (mainText) { take(mainText); colors["on-surface"] = mainText.hex; }
  if (variant) { take(variant); colors["on-surface-variant"] = variant.hex; }

  // borders are usually subtle: prefer low-contrast greys over currentColor-black borders
  const borderCands = clusters.filter((c) => c.border > 0 && chroma(c.rgb) < 25 && !used.has(c));
  const outline = (borderCands.filter((c) => contrast(c.rgb, pageRgb) < 3.2).sort((a, b) => b.border - a.border)[0]) ?? borderCands.sort((a, b) => b.border - a.border)[0];
  if (outline) { take(outline); colors.outline = outline.hex; }

  if (primaryBtn) {
    const fg = parseColor(primaryBtn.color);
    if (fg) colors["on-primary"] = toHex(flatten(fg, pageRgb));
  } else if (primary) {
    colors["on-primary"] = contrast(primary.rgb, { r: 255, g: 255, b: 255, a: 1 }) > 3 ? "#FFFFFF" : "#000000";
  }

  // a couple of extra accents if the brand is colorful
  let n = 1;
  for (const a of accents) {
    if (n > 3) break;
    if (!used.has(a.c) && distinct(a.c, 14) && a.score > 40) { take(a.c); colors[`accent-${n++}`] = a.c.hex; }
  }

  // ---------- TYPOGRAPHY ----------
  const fonts = raw.fonts.filter((f) => f.size >= 9 && f.family);
  const typography: Record<string, TypographyToken> = {};
  const fmt = (f: { family: string; size: number; weight: number; lineHeight: number | null; letterSpacing: number; transform?: string }): TypographyToken => {
    const t: TypographyToken = {
      fontFamily: f.family,
      fontSize: `${round(f.size, 0.5)}px`,
      fontWeight: f.weight,
      lineHeight: f.lineHeight ? +f.lineHeight.toFixed(2) : 1.2,
    };
    if (Math.abs(f.letterSpacing) >= 0.005) t.letterSpacing = `${+f.letterSpacing.toFixed(3)}em`;
    if (f.transform && f.transform !== "none") t.textTransform = f.transform;
    return t;
  };
  const body = fonts.filter((f) => f.size >= 13 && f.size <= 20).sort((a, b) => b.chars - a.chars)[0] ?? fonts[0];
  const usedSizes = new Set<string>();
  const addLevel = (name: string, f: typeof fonts[number] | undefined) => {
    if (!f) return;
    const key = `${f.family}|${round(f.size, 0.5)}|${f.weight}`;
    if (usedSizes.has(key)) return;
    usedSizes.add(key);
    typography[name] = fmt(f);
  };
  const lookup = (s: { fontFamily: string; fontSize: number; fontWeight: number }) =>
    fonts.find((f) => f.family === s.fontFamily && Math.abs(f.size - s.fontSize) < 0.6 && f.weight === s.fontWeight) ??
    { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, lineHeight: null, letterSpacing: 0, transform: "none", tags: [], chars: 0, sample: "", stack: s.fontFamily };

  const big = fonts.filter((f) => f.size >= 40).sort((a, b) => b.size - a.size);
  const h = Object.fromEntries(raw.components.headings.map((x) => [x.tag, x]));
  if (big[0] && (!h.h1 || big[0].size > h.h1.fontSize + 4)) addLevel("display", big[0]);
  if (h.h1) addLevel("headline-lg", lookup(h.h1));
  if (h.h2) addLevel("headline-md", lookup(h.h2));
  if (h.h3) addLevel("headline-sm", lookup(h.h3));
  if (!h.h1 && !h.h2) {
    const heads = fonts.filter((f) => f.size >= 22 && f.weight >= 500).sort((a, b) => b.size - a.size);
    addLevel("headline-lg", heads[0]);
    addLevel("headline-md", heads.find((f) => heads[0] && f.size < heads[0].size - 4));
  }
  if (h.h4) addLevel("title", lookup(h.h4));
  else addLevel("title", fonts.filter((f) => body && f.size > body.size + 1 && f.size <= 24).sort((a, b) => b.chars - a.chars)[0]);
  addLevel("body-lg", fonts.filter((f) => body && f.size > body.size && f.size <= 22 && f.weight < 600).sort((a, b) => b.chars - a.chars)[0]);
  addLevel("body-md", body);
  addLevel("body-sm", fonts.filter((f) => body && f.size < body.size && f.size >= 12.5 && f.weight < 600).sort((a, b) => b.chars - a.chars)[0]);
  if (primaryBtn) addLevel("label-md", lookup(primaryBtn));
  addLevel("label-caps", fonts.filter((f) => f.transform === "uppercase" && f.size <= 16).sort((a, b) => b.chars - a.chars)[0]);
  addLevel("caption", fonts.filter((f) => f.size >= 10 && f.size <= 13).sort((a, b) => a.size - b.size || b.chars - a.chars)[0]);
  const mono = fonts.find((f) => /mono|code|consol|courier|menlo/i.test(f.family) || f.tags.some((t) => ["code", "pre", "kbd"].includes(t)));
  if (mono) addLevel("code", mono);

  // font families with roles
  const famChars = new Map<string, { chars: number; stack: string }>();
  for (const f of fonts) {
    const e = famChars.get(f.family) ?? { chars: 0, stack: f.stack };
    e.chars += f.chars;
    famChars.set(f.family, e);
  }
  const headingFamily = typography["display"]?.fontFamily ?? typography["headline-lg"]?.fontFamily;
  const fontsOut = [...famChars.entries()]
    .sort((a, b) => b[1].chars - a[1].chars)
    .slice(0, 4)
    .map(([family, e]) => ({
      family,
      stack: e.stack,
      role: mono && family === mono.family ? "Monospace" : family === body?.family && family === headingFamily ? "Headings & body" : family === headingFamily ? "Headings" : family === body?.family ? "Body" : "Accent",
    }));

  // ---------- SPACING ----------
  const sp = raw.spacing.filter((s) => s.value >= 2);
  const totalW = sp.reduce((a, s) => a + s.weight, 0) || 1;
  const fit = (u: number) => sp.filter((s) => s.value % u === 0).reduce((a, s) => a + s.weight, 0) / totalW;
  const baseUnit = fit(8) > 0.62 ? 8 : fit(4) > 0.6 ? 4 : fit(2) > 0.8 ? 2 : 4;
  const candidates = [...new Set(sp.filter((s) => s.weight >= 2).slice(0, 18).map((s) => s.value))]
    .map((v) => (v % baseUnit === 0 ? v : round(v, baseUnit)))
    .filter((v) => v > 0);
  const uniq = [...new Set(candidates)].sort((a, b) => a - b);
  const names = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
  const spacing: Record<string, string> = { base: `${baseUnit}px` };
  const chosen = uniq.length <= names.length ? uniq : names.map((_, i) => uniq[Math.round((i * (uniq.length - 1)) / (names.length - 1))]);
  [...new Set(chosen)].forEach((v, i) => { if (names[i]) spacing[names[i]] = `${v}px`; });

  const maxWidth = raw.containerWidths[0]?.value ? `${raw.containerWidths[0].value}px` : null;
  if (maxWidth) spacing["container"] = maxWidth;

  // ---------- RADII ----------
  const rounded: Record<string, string> = {};
  const rad = raw.radii.filter((r) => r.value !== 9999 && r.value > 0 && r.value < 64);
  const rSorted = [...new Set(rad.filter((r) => r.weight >= 2 || rad.length < 4).map((r) => r.value))].sort((a, b) => a - b);
  // merge radii that are visually indistinguishable (e.g. 4/5/6px)
  const rUniq: number[] = [];
  for (const v of rSorted) {
    const last = rUniq[rUniq.length - 1];
    if (last === undefined || v - last >= Math.max(3, last * 0.4)) rUniq.push(v);
  }
  const rNames = ["sm", "md", "lg", "xl"];
  const rPick = rUniq.length <= 4 ? rUniq : rNames.map((_, i) => rUniq[Math.round((i * (rUniq.length - 1)) / 3)]);
  [...new Set(rPick)].forEach((v, i) => (rounded[rNames[i]] = `${v}px`));
  if (raw.radii.some((r) => r.value === 9999 && r.weight >= 1)) rounded.full = "9999px";
  if (!Object.keys(rounded).length) rounded.none = "0px";

  // ---------- SHADOWS ----------
  const blur = (s: string) => (s.match(/(-?\d+(\.\d+)?)px/g) || []).map(parseFloat).reduce((a, b) => a + Math.abs(b), 0);
  const shadowList = raw.shadows.filter((s) => !/^(rgba?\([^)]*\)\s+)?0px 0px 0px/.test(s.value) || s.value.split(",").length > 1)
    .slice(0, 6).sort((a, b) => blur(a.value) - blur(b.value));
  const shadows: Record<string, string> = {};
  const sNames = shadowList.length >= 3 ? ["sm", "md", "lg"] : ["sm", "md"];
  const sPick = shadowList.length <= 3 ? shadowList : [shadowList[0], shadowList[Math.floor(shadowList.length / 2)], shadowList[shadowList.length - 1]];
  sPick.forEach((s, i) => (shadows[sNames[i] ?? `level-${i}`] = s.value));

  // ---------- COMPONENTS ----------
  const colorRef = (c: string) => {
    const p = parseColor(c);
    if (!p || p.a < 0.05) return "transparent";
    const flat = p.a < 1 ? flatten(p, pageRgb) : p;
    for (const [k, v] of Object.entries(colors)) if (deltaE(parseColor(v)!, flat) < 3) return `{colors.${k}}`;
    return toHex(flat);
  };
  const radiusRef = (r: number) => {
    if (r === 9999 && rounded.full) return "{rounded.full}";
    for (const [k, v] of Object.entries(rounded)) if (Math.abs(parseFloat(v) - r) <= 1) return `{rounded.${k}}`;
    return `${r}px`;
  };
  const typoRef = (s: ComponentSample) => {
    for (const [k, t] of Object.entries(typography))
      if (t.fontFamily === s.fontFamily && Math.abs(parseFloat(t.fontSize) - s.fontSize) < 0.6 && t.fontWeight === s.fontWeight) return `{typography.${k}}`;
    return undefined;
  };
  const comp = (s: ComponentSample, extra: Record<string, string> = {}) => {
    const out: Record<string, string> = { backgroundColor: colorRef(s.bg), textColor: colorRef(s.color) };
    const t = typoRef(s);
    if (t) out.typography = t;
    out.rounded = radiusRef(s.radius);
    if (s.paddingY || s.paddingX) out.padding = `${s.paddingY}px ${s.paddingX}px`;
    if (s.height) out.height = `${s.height}px`;
    if (s.borderWidth > 0) out.border = `${s.borderWidth}px solid ${colorRef(s.borderColor)}`;
    return { ...out, ...extra };
  };

  const components: Record<string, Record<string, string>> = {};
  if (primaryBtn) components["button-primary"] = comp(primaryBtn);
  if (secondaryBtn) components["button-secondary"] = comp(secondaryBtn);
  const input = [...raw.components.inputs].filter((i) => i.height >= 24).sort((a, b) => (a.height > 72 ? 1 : 0) - (b.height > 72 ? 1 : 0))[0];
  if (input) components["input-field"] = comp(input);
  const card = raw.components.cards.sort((a, b) => (b.shadow ? 1 : 0) - (a.shadow ? 1 : 0))[0];
  if (card) {
    const { height: _h, ...c } = comp(card);
    void _h;
    components["card"] = c;
  }
  const link = raw.components.links.find((l) => findCluster(clusters, l.color, pageRgb) === primary) ?? raw.components.links[0];
  if (link) components["link"] = { textColor: colorRef(link.color), ...(typoRef(link) ? { typography: typoRef(link)! } : {}) };
  const badge = raw.components.badges.find((b) => !isTransparent(b.bg));
  if (badge) components["chip"] = comp(badge);
  if (raw.components.nav) {
    const nv = raw.components.nav;
    components["top-nav"] = { backgroundColor: colorRef(nv.bg), textColor: colorRef(nv.color), height: `${nv.height}px` };
  }

  const name = brandFromMeta(raw);
  return {
    name,
    description: raw.meta.description?.slice(0, 200) || `Design system extracted from ${raw.meta.url}`,
    colors,
    typography,
    rounded,
    spacing,
    shadows,
    components,
    fonts: fontsOut,
    gradients: raw.gradients.slice(0, 3).map((g) => g.value),
    cssVars: raw.cssVars.filter((v) => /color|bg|font|radius|space|shadow|primary|accent|brand/i.test(v.name)).slice(0, 60),
    layout: {
      maxWidth,
      baseUnit,
      usesGrid: raw.layout.grid > 3,
      usesFlex: raw.layout.flex > 10,
      stickyHeader: raw.layout.sticky > 0,
    },
  };
  void isDark;
}
