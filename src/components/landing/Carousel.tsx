"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  { s: "stripe", label: "stripe.com" }, { s: "framer", label: "framer.com" }, { s: "notion", label: "notion.com" },
  { s: "vercel", label: "vercel.com" }, { s: "raycast", label: "raycast.com" }, { s: "resend", label: "resend.com" },
  { s: "supabase", label: "supabase.com" }, { s: "apple", label: "apple.com" }, { s: "figma", label: "figma.com" },
];

/** Fanned 3D stack: the active card faces you, neighbours recede and tilt. */
export function Carousel() {
  const [i, setI] = useState(0);
  const n = ITEMS.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <div>
      <div className="relative h-[440px] select-none sm:h-[520px]" style={{ perspective: 1600 }}>
        {ITEMS.map((it, k) => {
          let off = k - i;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const abs = Math.abs(off);
          if (abs > 4) return null;
          return (
            <button key={it.s} onClick={() => setI(k)} aria-label={it.label}
              className="absolute left-1/2 top-1/2 w-[min(600px,80vw)] bg-[#2a292a] p-3 pb-2 text-left transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{
                transform: `translate(-50%, -50%) translateX(${off * 24}%) translateZ(${-abs * 140}px) rotateY(${-off * 14}deg) rotateZ(${off * 2.5}deg)`,
                zIndex: 10 - abs, filter: abs ? `brightness(${1 - abs * 0.18}) grayscale(${Math.min(1, abs * 0.5)})` : "none",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sites/${it.s}.jpg`} alt="" className="aspect-[16/10] w-full object-cover object-top" draggable={false} />
              <div className="mt-2 text-[15px] text-[#eeeeee]">{it.label}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={() => go(-1)} className="grid h-10 w-10 place-items-center bg-white/10 text-white hover:bg-white/15" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => go(1)} className="grid h-10 w-10 place-items-center bg-white/10 text-white hover:bg-white/15" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
