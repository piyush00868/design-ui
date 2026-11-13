// This script runs INSIDE the rendered page (via page.evaluate). It is kept as a
// plain JS string so the bundler never rewrites it with helpers that don't exist
// in the browser context. It walks the DOM, reads computed styles, and returns
// weighted raw observations that analyze.ts turns into design tokens.

export const COLLECTOR_SCRIPT = String.raw`
(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MAX = 5000;
  const colorMap = new Map();
  const addColor = (c, kind, w) => {
    if (!c || c === "transparent" || c === "rgba(0, 0, 0, 0)" || /^rgba\([^)]*,\s*0\)$/.test(c)) return;
    let e = colorMap.get(c);
    if (!e) { e = { value: c, text: 0, bg: 0, border: 0 }; colorMap.set(c, e); }
    e[kind] += w;
  };
  const bump = (map, key, w) => { if (key === undefined || key === null || key === "") return; map.set(key, (map.get(key) || 0) + (w || 1)); };
  const toList = (map) => Array.from(map.entries()).map(([value, weight]) => ({ value, weight })).sort((a, b) => b.weight - a.weight);

  const fontMap = new Map();
  const radii = new Map();
  const shadows = new Map();
  const spacing = new Map();
  const gradients = new Map();
  const widths = new Map();
  let flex = 0, grid = 0, sticky = 0;

  const isVisible = (el, cs, r) => {
    if (r.width < 1 || r.height < 1) return false;
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    return true;
  };
  const directText = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
    return t.replace(/\s+/g, " ").trim();
  };
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

  const all = Array.from(document.querySelectorAll("body, body *")).slice(0, MAX);
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "svg", "path", "meta", "link", "br", "iframe"].includes(tag)) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!isVisible(el, cs, r)) continue;
    const area = Math.min(r.width, vw) * Math.min(r.height, 2000);
    // above-the-fold content is weighted higher: it defines the first impression
    const fold = r.top + window.scrollY < vh * 1.5 ? 1.6 : 1;

    addColor(cs.backgroundColor, "bg", (area / 1000) * fold);
    if (cs.backgroundImage && cs.backgroundImage.includes("gradient")) bump(gradients, cs.backgroundImage.slice(0, 300), area / 1000);

    const bw = px(cs.borderTopWidth) + px(cs.borderBottomWidth) + px(cs.borderLeftWidth) + px(cs.borderRightWidth);
    if (bw > 0 && cs.borderStyle !== "none") addColor(cs.borderTopColor, "border", Math.max(1, (r.width + r.height) / 100));

    const text = directText(el);
    if (text.length > 0) {
      const w = Math.min(text.length, 400) * fold;
      addColor(cs.color, "text", w);
      const size = px(cs.fontSize);
      const lh = cs.lineHeight === "normal" ? null : +(px(cs.lineHeight) / size).toFixed(2);
      const ls = cs.letterSpacing === "normal" ? 0 : +(px(cs.letterSpacing) / size).toFixed(3);
      const family = (cs.fontFamily.split(",")[0] || "").replace(/["']/g, "").trim();
      const key = [family, size, cs.fontWeight, lh, ls, cs.textTransform].join("|");
      let f = fontMap.get(key);
      if (!f) {
        f = { family, stack: cs.fontFamily, size, weight: parseInt(cs.fontWeight) || 400, lineHeight: lh, letterSpacing: ls, transform: cs.textTransform, tags: [], chars: 0, sample: text.slice(0, 80) };
        fontMap.set(key, f);
      }
      f.chars += w;
      if (!f.tags.includes(tag) && f.tags.length < 6) f.tags.push(tag);
    }

    const rad = px(cs.borderTopLeftRadius);
    if (rad > 0 && (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || bw > 0 || tag === "img")) {
      const isPill = rad >= Math.min(r.height, r.width) / 2 - 1 && r.height < 80;
      bump(radii, isPill ? 9999 : Math.round(rad), 1);
    }
    if (cs.boxShadow && cs.boxShadow !== "none") bump(shadows, cs.boxShadow, 1);

    for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "rowGap", "columnGap"]) {
      const v = Math.round(px(cs[p]));
      if (v > 0 && v <= 160) bump(spacing, v, 1);
    }
    if (cs.display.includes("flex")) flex++;
    if (cs.display.includes("grid")) grid++;
    if ((cs.position === "sticky" || cs.position === "fixed") && r.top < 10 && r.width > vw * 0.8) sticky++;

    // container detection: wide-ish block, horizontally centered, not full-bleed
    if (r.width > 600 && r.width < vw - 40 && Math.abs(r.left - (vw - r.right)) < 4 && cs.maxWidth !== "none") {
      bump(widths, Math.round(px(cs.maxWidth)), 1);
    }
  }

  const sample = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      text: (el.innerText || el.value || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 40),
      bg: cs.backgroundColor, color: cs.color, borderColor: cs.borderTopColor,
      borderWidth: px(cs.borderTopWidth) * (cs.borderTopStyle === "none" ? 0 : 1),
      radius: px(cs.borderTopLeftRadius) >= Math.min(r.height, r.width) / 2 - 1 && r.height < 80 && px(cs.borderTopLeftRadius) > 0 ? 9999 : Math.round(px(cs.borderTopLeftRadius)),
      paddingX: Math.round(px(cs.paddingLeft)), paddingY: Math.round(px(cs.paddingTop)),
      height: Math.round(r.height), width: Math.round(r.width),
      fontFamily: (cs.fontFamily.split(",")[0] || "").replace(/["']/g, "").trim(),
      fontSize: px(cs.fontSize), fontWeight: parseInt(cs.fontWeight) || 400,
      shadow: cs.boxShadow === "none" ? "" : cs.boxShadow,
      textTransform: cs.textTransform, letterSpacing: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
    };
  };
  const visibleEls = (sel, limit) => Array.from(document.querySelectorAll(sel)).filter((el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return isVisible(el, cs, r) && r.width < vw * 0.9;
  }).slice(0, limit);

  const buttons = visibleEls("button, [role=button], a[class*=btn], a[class*=button], a[class*=Button], input[type=submit], [class*=cta]", 40)
    .filter((el) => { const r = el.getBoundingClientRect(); return r.height >= 24 && r.height <= 80 && r.width >= 40 && r.width <= 420; })
    .map(sample).filter((s) => s.text);

  // Many CTAs are plain links styled as buttons: filled or outlined, padded, rounded, button-sized.
  const seen = new Set(buttons.map((b) => b.text + b.bg));
  for (const el of visibleEls("a", 300)) {
    if (buttons.length >= 40) break;
    const r = el.getBoundingClientRect();
    if (r.height < 28 || r.height > 72 || r.width < 50 || r.width > 360) continue;
    const cs = getComputedStyle(el);
    const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    const outlined = px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
    if (!(filled || outlined) || px(cs.paddingLeft) < 8) continue;
    const s = sample(el);
    if (!s.text || seen.has(s.text + s.bg)) continue;
    seen.add(s.text + s.bg);
    buttons.push(s);
  }

  const inputs = visibleEls("input[type=text], input[type=email], input[type=search], input:not([type]), textarea, select", 8).map(sample);
  const links = visibleEls("main a, article a, p a, footer a, a", 30).map(sample).filter((s) => s.text);

  const cards = Array.from(document.querySelectorAll("div, article, li, section, a")).slice(0, 3000).filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 160 || r.width > 640 || r.height < 120 || r.height > 900) return false;
    const cs = getComputedStyle(el);
    if (!isVisible(el, cs, r)) return false;
    const hasSurface = cs.boxShadow !== "none" || (px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") || cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    return hasSurface && px(cs.borderTopLeftRadius) > 0 && el.children.length >= 2;
  }).slice(0, 12).map(sample);

  const navEl = document.querySelector("header nav, header, nav, [role=banner]");
  const nav = navEl && navEl.getBoundingClientRect().height > 0 ? sample(navEl) : null;
  const headings = ["h1", "h2", "h3", "h4"].map((tag) => {
    const el = visibleEls(tag, 1)[0] || Array.from(document.querySelectorAll(tag))[0];
    return el ? Object.assign(sample(el), { tag }) : null;
  }).filter(Boolean);
  const badges = visibleEls("[class*=badge], [class*=Badge], [class*=chip], [class*=tag], [class*=pill]", 20)
    .filter((el) => { const r = el.getBoundingClientRect(); return r.height < 36 && r.width < 220; }).map(sample).filter((s) => s.text);

  // CSS custom properties declared on :root (same-origin sheets only)
  const cssVars = [];
  const rootCs = getComputedStyle(document.documentElement);
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const rule of Array.from(rules || [])) {
        if (rule.selectorText && /(^|,)\s*(:root|html)\s*(,|$)/.test(rule.selectorText)) {
          for (const name of Array.from(rule.style)) {
            if (name.startsWith("--") && cssVars.length < 400) cssVars.push({ name, value: rootCs.getPropertyValue(name).trim() || rule.style.getPropertyValue(name).trim() });
          }
        }
      }
    }
  } catch (e) {}

  const loadedFonts = [];
  try { document.fonts.forEach((f) => { if (f.status === "loaded") { const n = f.family.replace(/["']/g, ""); if (!loadedFonts.includes(n)) loadedFonts.push(n); } }); } catch (e) {}

  const metaContent = (sel) => (document.querySelector(sel) || {}).content || "";
  const iconEl = document.querySelector("link[rel~=icon], link[rel=apple-touch-icon]");
  const bodyCs = getComputedStyle(document.body);
  const htmlCs = getComputedStyle(document.documentElement);
  const bodyBg = bodyCs.backgroundColor !== "rgba(0, 0, 0, 0)" ? bodyCs.backgroundColor : (htmlCs.backgroundColor !== "rgba(0, 0, 0, 0)" ? htmlCs.backgroundColor : "rgb(255, 255, 255)");

  return {
    meta: {
      url: location.href, title: document.title, description: metaContent("meta[name=description]") || metaContent("meta[property='og:description']"),
      themeColor: metaContent("meta[name=theme-color]"), favicon: iconEl ? iconEl.href : location.origin + "/favicon.ico",
      ogImage: metaContent("meta[property='og:image']"), lang: document.documentElement.lang || "",
      viewport: { width: vw, height: vh, scrollHeight: document.documentElement.scrollHeight },
    },
    colors: Array.from(colorMap.values()),
    gradients: toList(gradients).slice(0, 8),
    fonts: Array.from(fontMap.values()).sort((a, b) => b.chars - a.chars).slice(0, 80),
    loadedFonts,
    radii: toList(radii).slice(0, 20),
    shadows: toList(shadows).slice(0, 12),
    spacing: toList(spacing).slice(0, 40),
    containerWidths: toList(widths).filter((w) => w.value > 0).slice(0, 8),
    layout: { flex, grid, sticky, elements: all.length },
    cssVars,
    components: { buttons, inputs, links, cards, nav, headings, badges },
    bodyBg, bodyColor: bodyCs.color,
  };
})()
`;
