const SITES = ["stripe", "framer", "notion", "vercel", "raycast", "resend", "supabase", "apple", "figma", "arc"];
const LABEL: Record<string, string> = { stripe: "stripe.com", framer: "framer.com", notion: "notion.com", vercel: "vercel.com", raycast: "raycast.com", resend: "resend.com", supabase: "supabase.com", apple: "apple.com", figma: "figma.com", arc: "arc.net" };

function Row({ items, reverse, tilt }: { items: string[]; reverse?: boolean; tilt: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-visible" style={{ transform: `rotateX(${tilt}deg)`, transformStyle: "preserve-3d" }}>
      <div className={`wall-row flex w-max gap-5 ${reverse ? "reverse" : ""}`}>
        {doubled.map((s, i) => (
          <figure key={i} className="wall-card w-[380px] shrink-0 bg-[#1f1e1f] p-3 pb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sites/${s}.jpg`} alt="" loading={i < 6 ? "eager" : "lazy"} className="aspect-[16/10] w-full object-cover object-top" />
            <figcaption className="mt-2 text-[11px] text-[#9a999a]">{LABEL[s]}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Curved, slowly drifting wall of real website screenshots behind the hero. */
export function HeroWall() {
  return (
    <div aria-hidden className="wall pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden -z-10">
      <div className="wall-track absolute left-1/2 top-[40px] flex w-[2600px] -translate-x-1/2 flex-col gap-6" style={{ transform: "translateX(-50%) rotateX(14deg) translateZ(-120px)" }}>
        <div className="opacity-30 blur-[3px]"><Row items={SITES.slice(0, 7)} tilt={0} /></div>
        <div className="opacity-35 blur-[2px]"><Row items={SITES.slice(3).concat(SITES.slice(0, 3))} reverse tilt={0} /></div>
        <div className="opacity-90"><Row items={SITES.slice(5).concat(SITES.slice(0, 5))} tilt={-6} /></div>
      </div>
      <div className="wall-fade absolute inset-0" />
    </div>
  );
}
