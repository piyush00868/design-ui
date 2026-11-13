import { Code2, FileText, Palette, ScanSearch, Sparkles, Type, Wand2 } from "lucide-react";
import { Nav, REPO_URL } from "@/components/Nav";
import { PromptBox } from "@/components/PromptBox";

const STEPS = [
  { icon: ScanSearch, title: "Paste a URL or screenshot", body: "We open the site in a real browser, measure every element's styles and capture each section's layout, copy and images." },
  { icon: Sparkles, title: "AI rebuilds it", body: "Our AI recreates the page section by section with the exact colors, fonts and spacing. Watch it build live." },
  { icon: Wand2, title: "Make it yours", body: "Chat to edit: swap in your brand, rewrite copy, add sections. Click any section to change just that part. Every edit is versioned." },
];

const OUTPUTS = [
  { icon: Code2, title: "Editable clone", body: "A responsive HTML + Tailwind recreation you can edit by chatting, then export as HTML or a React component." },
  { icon: Palette, title: "Multi-page sites", body: "Clone inner pages (pricing, about, docs) from the site's navigation with a consistent header and footer." },
  { icon: FileText, title: "DESIGN.md", body: "The site's design system in the open DESIGN.md format. Drop it into Cursor, Claude Code, v0 or Lovable." },
  { icon: Type, title: "Tokens & Tailwind", body: "Tailwind v3/v4 config, CSS variables and W3C design tokens with the exact colors, type scale and radii." },
];

const FAQ = [
  { q: "Is it free?", a: "Yes. It's an open-source side project built for students and developers. Run it yourself with your own AI key for unlimited use." },
  { q: "How accurate is it?", a: "Colors, fonts, sizes and radii are measured from the live page, and the AI gets each section's real copy, images and layout plus full-page screenshots. Screenshot-only clones are close estimates." },
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
            <Wand2 className="h-3.5 w-3.5 text-pink-300" /> Clone, edit with AI, export to HTML, React and DESIGN.md
          </a>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Clone any website <span className="text-gradient">with AI</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
            Paste a URL or drop a screenshot. Get an editable, pixel-close copy you can customize by chatting, then export as code.
          </p>
          <div className="mt-10 w-full">
            <PromptBox />
          </div>
        </section>
        <div className="h-24" />
      </div>

      <section id="how" className="relative z-10 mx-auto mt-24 max-w-6xl scroll-mt-20 px-5">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">How it works</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted">Measured from the real site, rebuilt by AI, edited by you.</p>
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
