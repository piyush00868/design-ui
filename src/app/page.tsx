import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Agents } from "@/components/landing/Agents";
import { Carousel } from "@/components/landing/Carousel";
import { HeroWall } from "@/components/landing/HeroWall";
import { IsoExport, IsoGrid, IsoLayers, IsoPages, IsoRow, IsoScan } from "@/components/landing/Iso";
import { Playground } from "@/components/landing/Playground";
import { RevealOnScroll } from "@/components/landing/Reveal";
import { Mark } from "@/components/Logo";
import { Nav, REPO_URL } from "@/components/Nav";
import { PromptBox } from "@/components/PromptBox";

const FEATURES = [
  { art: IsoScan, title: "Measured, not guessed", body: "We open the site in a real browser and read the exact color, font, size and spacing of every element.", span: "lg:col-span-5" },
  { art: IsoGrid, title: "Every section, rebuilt", body: "Nav, hero, logo walls, grids, footers. The real copy and images go in, an editable page comes out.", span: "lg:col-span-4" },
  { art: IsoRow, title: "HTML, React or DESIGN.md", body: "Download one clean file, convert it to a Next.js component, or hand the tokens to your AI.", span: "lg:col-span-3" },
  { art: IsoPages, title: "\u201cMake it ours.\u201d One message", body: "Chat to swap in your brand colors, rewrite the copy or add a pricing section.", span: "lg:col-span-3" },
  { art: IsoLayers, title: "Click a section, edit just that", body: "Select the hero and change only the hero. Everything else stays exactly where it was.", span: "lg:col-span-4" },
  { art: IsoExport, title: "Whole sites, not just pages", body: "Clone pricing, about and docs pages from the site\u2019s own menu, with a shared header and footer.", span: "lg:col-span-5" },
];

const STEPS = [
  { n: "01", title: "Paste a link", body: "Any public website, or a screenshot of one." },
  { n: "02", title: "Watch it rebuild", body: "Section by section, live, in about a minute." },
  { n: "03", title: "Make it yours", body: "Edit by chatting. Every change is a saved version." },
  { n: "04", title: "Ship it", body: "Export HTML, React or a DESIGN.md for your AI." },
];

const FAQ = [
  { q: "Is it really free?", a: "Yes. DesignDNA is an open-source side project built for students and developers. The hosted version has fair daily limits; self-host it with your own AI key for unlimited use." },
  { q: "How close is the clone?", a: "Colors, fonts, sizes and radii are measured from the live page, and the AI gets each section\u2019s real text, images and layout plus full-page screenshots. Complex animations and canvas graphics are simplified." },
  { q: "What is DESIGN.md?", a: "An open, plain-text format (popularized by Google Stitch) that describes a design system as YAML tokens plus guidance, so coding agents like Cursor and Claude Code can follow it." },
  { q: "Can I clone any site?", a: "Any public page. Use it to learn, prototype and get inspired. Respect trademarks and don\u2019t pass off someone else\u2019s brand as your own." },
];

export default function Home() {
  return (
    <main className="relative overflow-x-clip">
      <RevealOnScroll />

      {/* HERO */}
      <section className="relative isolate h-[900px] overflow-hidden">
        <HeroWall />
        <Nav />
        <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center px-5 pt-14 text-center sm:pt-16">
          <h1 className="display text-balance text-[44px] sm:text-[64px]">Clone any website&apos;s design in&nbsp;minutes.</h1>
          <p className="mt-6 max-w-[640px] text-balance text-[18px] leading-[1.45] text-soft">
            Paste a link, get an editable copy with the real colors, fonts and layout. Restyle it by chatting, then export clean HTML, React or a DESIGN.md.
          </p>
          <div className="mt-10 w-full"><PromptBox /></div>
        </div>
      </section>

      {/* PLAYGROUND */}
      <section id="try" className="mx-auto max-w-[1376px] scroll-mt-10 px-5 py-28 sm:px-8 sm:py-36">
        <Playground />
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-[1376px] scroll-mt-10 px-5 py-20 sm:px-8">
        <h2 className="h2 reveal text-[34px] sm:text-[40px]">From any link to<br />your own site.</h2>
        <div className="hairline-grid mt-14 grid grid-cols-1 lg:grid-cols-12">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`reveal flex flex-col border-line-strong p-8 sm:p-10 ${f.span} ${i % 3 !== 2 ? "lg:border-r" : ""} ${i < 3 ? "border-b" : i < 5 ? "border-b lg:border-b-0" : ""}`} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <div className="mx-auto h-[220px] w-full max-w-[360px]"><f.art /></div>
              <h3 className="mt-8 text-[16px] font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-2 max-w-[360px] text-[14px] leading-[1.5] text-muted">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex justify-center"><Link href="/signup" className="btn btn-accent">Start cloning</Link></div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="mx-auto max-w-[1180px] scroll-mt-10 px-5 py-36 sm:px-8">
        <Agents />
      </section>

      {/* CAROUSEL */}
      <section className="py-20">
        <div className="mx-auto max-w-[1376px] px-5 sm:px-8">
          <h2 className="h2 reveal text-[34px] sm:text-[40px]">Cloned this week</h2>
          <p className="reveal mt-4 text-[18px] text-muted">Real sites people pointed DesignDNA at. Click one to take a closer look.</p>
        </div>
        <div className="mt-10"><Carousel /></div>
      </section>

      {/* LIGHT ACT */}
      <div className="bg-[#eeeeee] text-[#141314] [html.light_&]:bg-[#141314] [html.light_&]:text-[#eeeeee]">
        <section className="mx-auto max-w-[1376px] px-5 py-32 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="h2 reveal max-w-[560px] text-[34px] sm:text-[40px]">Four steps. About a minute.</h2>
            <Link href="/signup" className="btn btn-accent reveal">Try it free</Link>
          </div>
          <div className="mt-16 grid border-t border-black/15 sm:grid-cols-2 lg:grid-cols-4 [html.light_&]:border-white/15">
            {STEPS.map((s, i) => (
              <div key={s.n} className="reveal border-b border-black/15 py-10 pr-8 lg:border-b-0 [html.light_&]:border-white/15" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="font-mono text-[13px] text-[#fb460d]">{s.n}</div>
                <div className="mt-10 text-[26px] font-medium tracking-[-0.03em]">{s.title}</div>
                <p className="mt-2 text-[15px] text-[#696869]">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1376px] gap-10 px-5 pb-32 sm:px-8 lg:grid-cols-[1fr_2fr]">
          <h2 className="h2 reveal text-[34px] sm:text-[40px]">Built for people<br />who learn by doing.</h2>
          <div className="reveal space-y-10">
            <p className="text-[26px] leading-[1.25] tracking-[-0.02em] sm:text-[31px]"><span className="text-[#fb460d]">Students</span> take apart the sites they admire and see exactly which font, size and spacing make them work.</p>
            <p className="text-[26px] leading-[1.25] tracking-[-0.02em] sm:text-[31px]"><span className="text-[#fb460d]">Developers</span> start from a real layout instead of a blank file, then hand the DESIGN.md to their coding agent.</p>
            <p className="text-[26px] leading-[1.25] tracking-[-0.02em] sm:text-[31px]"><span className="text-[#fb460d]">Designers</span> turn a reference into an editable page in a minute, then make it their own.</p>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-[1376px] scroll-mt-10 px-5 pb-32 sm:px-8">
          <h2 className="h2 reveal max-w-[640px] text-[34px] sm:text-[40px]">Free while you learn. Yours if you self-host.</h2>
          <div className="mt-14 grid gap-px bg-black/15 lg:grid-cols-2 [html.light_&]:bg-white/15">
            {[
              { name: "Hosted", price: "Free", note: "No card needed", items: ["25 clones a day", "Unlimited projects and versions", "Chat and section edits", "HTML, React and DESIGN.md exports"], cta: "Start cloning", href: "/signup", accent: true },
              { name: "Self-hosted", price: "Open source", note: "MIT license", items: ["Unlimited everything", "Bring your own AI key", "Deploy anywhere Node runs", "Hack on the extraction engine"], cta: "View on GitHub", href: REPO_URL, accent: false },
            ].map((p) => (
              <div key={p.name} className="reveal flex flex-col bg-[#eeeeee] p-10 [html.light_&]:bg-[#141314]">
                <div className="text-[15px] text-[#696869]">{p.name}</div>
                <div className="mt-6 text-[48px] font-medium tracking-[-0.04em]">{p.price}</div>
                <div className="text-[14px] text-[#696869]">{p.note}</div>
                <ul className="mt-10 space-y-3 text-[15px]">
                  {p.items.map((it) => <li key={it} className="flex items-center gap-3"><Check className="h-4 w-4 text-[#fb460d]" />{it}</li>)}
                </ul>
                <Link href={p.href} target={p.href.startsWith("http") ? "_blank" : undefined} className={`btn mt-12 self-start ${p.accent ? "btn-accent" : "bg-[#141314] text-[#eeeeee] hover:bg-black [html.light_&]:bg-[#eeeeee] [html.light_&]:text-[#141314]"}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto grid max-w-[1376px] gap-10 px-5 pb-32 sm:px-8 lg:grid-cols-[1fr_2fr]">
          <h2 className="h2 reveal text-[34px] sm:text-[40px]">Questions</h2>
          <div className="reveal border-t border-black/15 [html.light_&]:border-white/15">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-black/15 py-6 [html.light_&]:border-white/15">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[20px] font-medium tracking-[-0.02em]">
                  {f.q}<span className="text-[24px] font-light text-[#fb460d] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-[720px] text-[16px] leading-[1.55] text-[#696869]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1376px] px-5 py-36 text-center sm:px-8">
        <h2 className="display reveal mx-auto max-w-[820px] text-balance text-[44px] sm:text-[64px]">See a site you love?<br />Clone it instead of starting fresh.</h2>
        <div className="reveal mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn btn-accent">Start cloning <ArrowRight className="h-4 w-4" /></Link>
          <Link href="#try" className="btn btn-ghost">Open the playground</Link>
        </div>
      </section>

      <footer className="border-t border-line-strong">
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-5 py-10 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 text-white"><Mark className="h-4 w-4" /> DesignDNA <span className="text-muted">· built by Piyush Kumar</span></div>
          <div className="flex gap-6">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href={REPO_URL} target="_blank" className="hover:text-white">GitHub</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
