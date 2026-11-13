import { Code2, FileText, Palette, ScanSearch, Sparkles, Type, Wand2 } from "lucide-react";
import { Nav, REPO_URL } from "@/components/Nav";
import { PromptBox } from "@/components/PromptBox";
import { RecentGrid } from "@/components/RecentGrid";

const STEPS = [
  { icon: ScanSearch, title: "Render & measure", body: "We open the site in a real headless browser and read the computed styles of every visible element. No guessing from pixels." },
  { icon: Palette, title: "Distill the system", body: "Thousands of raw values are clustered into a clean palette with roles, a type scale, a spacing grid, radii, shadows and components." },
  { icon: Sparkles, title: "Explain it with AI", body: "A vision model looks at the screenshot and writes the why: brand personality, usage rules, do's and don'ts." },
];

const OUTPUTS = [
  { icon: FileText, title: "DESIGN.md", body: "Follows the open DESIGN.md spec. Drop it into Cursor, Claude Code, v0 or Lovable and your AI builds on-brand." },
  { icon: Palette, title: "Tailwind v3 & v4", body: "A ready theme config with the exact colors, fonts, type scale, radii and shadows." },
  { icon: Type, title: "CSS variables & tokens", body: "Plain :root variables plus W3C design tokens JSON for Style Dictionary or Figma Tokens Studio." },
  { icon: Code2, title: "Recreated code", body: "One click turns the design into a responsive HTML + Tailwind page you can preview and download." },
];

const FAQ = [
  { q: "Is it free?", a: "Yes. It's an open-source side project built for students and developers. Run it yourself with your own AI key for unlimited use." },
  { q: "How accurate is it?", a: "For URLs, colors, fonts, sizes and radii are measured from the live page, so they're exact. Screenshots use a vision model, so values are close estimates." },
  { q: "What is DESIGN.md?", a: "An open, plain-text format (popularized by Google Stitch) that describes a design system with YAML tokens plus prose, so AI agents can follow it." },
  { q: "Can I clone any site?", a: "Any public page. Use it to learn and get inspired. Respect trademarks and don't pass off someone else's brand as your own." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="relative">
        <div className="aurora" />
        <Nav />
        <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-10 pt-16 text-center sm:pt-24">
          <a href="#output" className="mb-7 flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-3 py-1 text-xs text-muted backdrop-blur hover:text-white">
            <Wand2 className="h-3.5 w-3.5 text-pink-300" /> Exports the open DESIGN.md format
          </a>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Clone any website&apos;s <span className="text-gradient">design system</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
            Paste a URL or drop a screenshot. Get its colors, typography, spacing and components as a DESIGN.md, Tailwind config and code.
          </p>
          <div className="mt-10 w-full">
            <PromptBox />
          </div>
        </section>
        <div className="h-24" />
      </div>

      <RecentGrid />

      <section id="how" className="relative z-10 mx-auto mt-24 max-w-6xl scroll-mt-20 px-5">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">How it works</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted">Measured, not hallucinated. AI only writes the explanation.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-line bg-panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-pink-300"><s.icon className="h-5 w-5" /></span>
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
              </div>
              <h3 className="font-medium text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="output" className="relative z-10 mx-auto mt-24 max-w-6xl scroll-mt-20 px-5">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">What you get</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {OUTPUTS.map((o) => (
            <div key={o.title} className="flex gap-4 rounded-2xl border border-line bg-panel p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6d82ff]/20 to-[#ff5c9d]/20 text-white"><o.icon className="h-5 w-5" /></span>
              <div>
                <h3 className="font-medium text-white">{o.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{o.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto mt-24 max-w-3xl scroll-mt-20 px-5">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">FAQ</h2>
        <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-panel">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-white">
                {f.q}<span className="text-faint transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-24 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-5 py-8 text-sm text-faint sm:flex-row">
        <span>DesignDNA · built by Piyush Kumar</span>
        <a href={REPO_URL} target="_blank" className="hover:text-white">Open source on GitHub</a>
      </footer>
    </main>
  );
}
