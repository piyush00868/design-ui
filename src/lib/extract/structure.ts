// Runs INSIDE the page. Produces a compact, ordered outline of the page's visible
// sections (text, images, buttons, layout hints, colors) that an LLM can use to
// rebuild the page faithfully with real copy and real image URLs.

export const STRUCTURE_SCRIPT = String.raw`
(() => {
  const vw = window.innerWidth;
  const px = (v) => parseFloat(v) || 0;
  const hex = (c) => {
    const m = (c || "").match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (p.length > 3 && p[3] < 0.05) return null;
    return "#" + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
  };
  const vis = (el) => {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && px(cs.opacity) > 0.05;
  };
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return ""; } };
  const clean = (t) => (t || "").replace(/\s+/g, " ").trim();

  // ---- find the top-level "sections" (big horizontal bands of the page) ----
  const isBand = (el) => { const r = el.getBoundingClientRect(); return r.width >= vw * 0.85 && r.height >= 40; };
  let roots = [document.body];
  // descend through single wrappers (#__next, main, div.app...) until we hit multiple bands
  for (let i = 0; i < 6; i++) {
    const next = [];
    for (const r of roots) {
      const kids = Array.from(r.children).filter((c) => vis(c) && isBand(c) && !["SCRIPT","STYLE","NOSCRIPT"].includes(c.tagName));
      if (kids.length === 1 && kids[0].children.length) next.push(kids[0]);
      else if (kids.length) next.push(...kids);
      else next.push(r);
    }
    const changed = next.length !== roots.length || next.some((n, j) => n !== roots[j]);
    roots = next;
    if (!changed || roots.length > 2) break;
  }
  // expand <main>-like containers that hold many bands
  const sections = [];
  for (const r of roots) {
    const kids = Array.from(r.children).filter((c) => vis(c) && isBand(c));
    if (r.tagName === "MAIN" || (kids.length >= 3 && r.getBoundingClientRect().height > window.innerHeight * 2)) sections.push(...kids);
    else sections.push(r);
  }

  const MAX_LINES = 70;
  const describe = (sec, idx) => {
    const r = sec.getBoundingClientRect();
    const cs = getComputedStyle(sec);
    let bg = hex(cs.backgroundColor);
    if (!bg) { let p = sec.parentElement; while (p && !bg) { bg = hex(getComputedStyle(p).backgroundColor); p = p.parentElement; } }
    const bgImg = cs.backgroundImage && cs.backgroundImage !== "none" ? cs.backgroundImage.slice(0, 160) : "";
    const tag = sec.tagName.toLowerCase();
    const role = tag === "header" || tag === "nav" || idx === 0 && r.top + scrollY < 120 ? "header/nav" : tag === "footer" ? "footer" : "section";
    const lines = [];
    const seen = new Set();
    const walk = (el, depth) => {
      if (lines.length >= MAX_LINES || !vis(el)) return;
      const t = el.tagName;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(t)) return;
      const ecs = getComputedStyle(el);
      if (t === "IMG" || t === "PICTURE" || t === "VIDEO") {
        const img = t === "PICTURE" ? el.querySelector("img") : el;
        const src = img ? abs(img.currentSrc || img.src || img.getAttribute("poster") || "") : "";
        const er = el.getBoundingClientRect();
        if (src && !seen.has(src) && er.width > 24) { seen.add(src); lines.push("IMG " + Math.round(er.width) + "x" + Math.round(er.height) + (img.alt ? ' alt="' + clean(img.alt).slice(0, 60) + '"' : "") + " src=" + src.slice(0, 220)); }
        return;
      }
      if (t === "svg" || t === "SVG") {
        const er = el.getBoundingClientRect();
        if (er.width > 60 && lines.length < MAX_LINES) lines.push("SVG/logo " + Math.round(er.width) + "x" + Math.round(er.height) + (el.getAttribute("aria-label") ? " " + el.getAttribute("aria-label") : ""));
        return;
      }
      const isBtn = t === "BUTTON" || el.getAttribute("role") === "button" || (t === "A" && (hex(ecs.backgroundColor) || (px(ecs.borderTopWidth) > 0 && ecs.borderTopStyle !== "none")) && px(ecs.paddingLeft) >= 8);
      if (isBtn) {
        const label = clean(el.innerText).slice(0, 50);
        if (label) lines.push("BUTTON \"" + label + "\" bg=" + (hex(ecs.backgroundColor) || "none") + " color=" + hex(ecs.color) + " radius=" + Math.round(px(ecs.borderTopLeftRadius)) + (px(ecs.borderTopWidth) ? " border=" + hex(ecs.borderTopColor) : ""));
        return;
      }
      if (ecs.display.includes("grid") || ecs.display.includes("flex")) {
        const kids = Array.from(el.children).filter(vis);
        if (kids.length >= 3 && kids.length <= 12) {
          const rows = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top / 10)));
          const cols = Math.round(kids.length / rows.size);
          if (cols >= 2) lines.push("ROW/GRID " + cols + " columns x " + rows.size + " rows" + (ecs.gap && ecs.gap !== "normal" ? " gap=" + ecs.gap : ""));
        }
      }
      // direct text of this element; if all children are inline, treat the whole thing as one text run
      const INLINE = ["SPAN", "EM", "STRONG", "B", "I", "BR", "CODE", "SMALL", "MARK", "SUP", "SUB", "U", "A"];
      const allInline = el.children.length > 0 && Array.from(el.children).every((c) => INLINE.includes(c.tagName) && !c.querySelector("img,svg,div,p,ul,button"));
      let own = "";
      if (allInline && t !== "A" && /^(H[1-6]|P|LI|SPAN|DIV|LABEL|BLOCKQUOTE|FIGCAPTION|DT|DD)$/.test(t)) own = el.innerText;
      else for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
      own = clean(own);
      { const h = own.slice(0, Math.floor(own.length / 2)).trim(); if (h.length > 8 && own === h + " " + h) own = h; }
      if (own.length > 1) {
        const tagName = /^H[1-6]$/.test(t) ? t : t === "A" ? "LINK" : t === "LI" ? "LI" : t === "LABEL" ? "LABEL" : "TEXT";
        const meta = Math.round(px(ecs.fontSize)) + "px/" + ecs.fontWeight + " " + (hex(ecs.color) || "");
        lines.push(tagName + " [" + meta + "] " + own.slice(0, tagName === "TEXT" ? 220 : 120));
      }
      if (t === "INPUT" || t === "TEXTAREA") lines.push("INPUT placeholder=\"" + clean(el.placeholder || el.value).slice(0, 50) + "\"");
      if (allInline && own.length > 1 && t !== "A") return;
      for (const c of el.children) walk(c, depth + 1);
    };
    walk(sec, 0);
    return {
      index: idx, role, tag, height: Math.round(r.height), bg: bg || "", bgImage: bgImg,
      layout: cs.display, lines,
    };
  };

  const out = sections.slice(0, 18).map(describe).filter((s) => s.lines.length);

  // same-origin navigation links for multi-page cloning
  const navLinks = [];
  const seenPaths = new Set([location.pathname]);
  const navEls = Array.from(document.querySelectorAll("header a, nav a, footer a"));
  for (const a of navEls) {
    try {
      const u = new URL(a.href);
      if (u.origin !== location.origin) continue;
      const path = u.pathname.replace(/\/$/, "") || "/";
      if (seenPaths.has(path) || /\.(pdf|png|jpg|zip|xml)$/i.test(path) || /(login|signin|signup|sign-up|logout|cart|account|legal|privacy|terms|cookie)/i.test(path)) continue;
      const label = clean(a.innerText);
      if (!label || label.length > 40) continue;
      seenPaths.add(path);
      navLinks.push({ path, label, url: u.origin + path, inHeader: !!a.closest("header, nav") });
    } catch {}
  }
  navLinks.sort((a, b) => Number(b.inHeader) - Number(a.inHeader));

  return { sections: out, navLinks: navLinks.slice(0, 12), title: document.title, pageHeight: document.documentElement.scrollHeight };
})()
`;

export type PageStructure = {
  sections: { index: number; role: string; tag: string; height: number; bg: string; bgImage: string; layout: string; lines: string[] }[];
  navLinks: { path: string; label: string; url: string; inHeader: boolean }[];
  title: string;
  pageHeight: number;
};

export function structureToText(s: PageStructure, maxChars = 22000): string {
  const parts: string[] = [];
  for (const sec of s.sections) {
    parts.push(`\n### Section ${sec.index + 1} (${sec.role}, ~${sec.height}px tall, bg ${sec.bg || "inherit"}${sec.bgImage ? `, background-image ${sec.bgImage}` : ""})`);
    parts.push(...sec.lines);
  }
  let text = parts.join("\n");
  if (text.length > maxChars) text = text.slice(0, maxChars) + "\n…(truncated)";
  return text;
}
