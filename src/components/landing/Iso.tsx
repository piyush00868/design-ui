// Isometric line illustrations (grey hairlines, one orange accent), in the spirit of annnimate.com.
const G = "currentColor";
const A = "#fb460d";

function cube(x: number, y: number, s: number, h: number, accent = false, dashed = true) {
  const c = accent ? A : G;
  const w = s * 0.866, d = s * 0.5;
  const top = `M${x},${y - h} l${w},${d} l${-w},${d} l${-w},${-d} Z`;
  const left = `M${x - w},${y - h + d} v${h} l${w},${d} v${-h}`;
  const right = `M${x + w},${y - h + d} v${h} l${-w},${d}`;
  return (
    <g key={`${x}-${y}-${h}`} fill="none" stroke={c} strokeWidth={accent ? 1.2 : 1}>
      <path d={top} />
      <path d={left} strokeDasharray={dashed && !accent ? "2 2" : undefined} />
      <path d={right} />
    </g>
  );
}
function slab(x: number, y: number, s: number, t: number, accent = false) {
  return cube(x, y, s, t, accent, false);
}

export function IsoScan() {
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{cube(110, 150, 58, 58)}{cube(180, 150, 58, 112)}{cube(250, 150, 58, 58)}{cube(180, 52, 28, 26, true)}</svg>;
}
export function IsoGrid() {
  const tiles = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i || j) tiles.push(slab(180 + (i - j) * 52, 120 + (i + j) * 30, 50, 6));
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{tiles}{cube(180, 150, 50, 62, true)}</svg>;
}
export function IsoRow() {
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{cube(110, 130, 44, 50)}{cube(180, 130, 44, 50, true)}{cube(250, 130, 44, 50)}</svg>;
}
export function IsoLayers() {
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{[0, 1, 2, 3].map((i) => slab(180, 190 - i * 18, 110, 10))}{slab(180, 118, 110, 10, true)}</svg>;
}
export function IsoPages({ n = 8 }: { n?: number }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = 90 + i * 20, y = 50 + i * 11, acc = i === n - 1;
    out.push(<path key={i} d={`M${x},${y} l36,-20 v100 l-36,20 Z`} fill="none" stroke={acc ? A : G} strokeWidth={acc ? 1.2 : 1} strokeDasharray={acc ? undefined : i % 2 ? "2 2" : undefined} />);
  }
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{out}</svg>;
}
export function IsoExport() {
  return <svg viewBox="0 0 360 220" className="h-full w-full text-[#5a595a]">{slab(150, 170, 70, 30)}{slab(230, 150, 50, 22)}{cube(190, 92, 32, 32, true)}<path d="M190 30 v26 M182 48 l8 8 l8 -8" stroke={A} fill="none" strokeWidth="1.2" /></svg>;
}
