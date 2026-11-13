import Link from "next/link";
import { Logo } from "./Logo";

export function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export const REPO_URL = "https://github.com/piyush00868/design-ui";

export function Nav() {
  return (
    <header className="relative z-20 mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
        <a href="#how" className="hover:text-white">How it works</a>
        <a href="#output" className="hover:text-white">What you get</a>
        <a href="#faq" className="hover:text-white">FAQ</a>
      </nav>
      <div className="flex items-center gap-2">
        <Link href={REPO_URL} target="_blank" className="flex items-center gap-2 rounded-lg border border-line-strong bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10">
          <GithubIcon /> <span className="hidden sm:inline">Star on GitHub</span>
        </Link>
      </div>
    </header>
  );
}
