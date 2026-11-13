import Link from "next/link";
import { currentUser } from "@/lib/server/auth";
import { GithubIcon } from "./icons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export { GithubIcon };
export const REPO_URL = "https://github.com/piyush00868/design-ui";

const LINKS = [
  { href: "/#try", label: "Playground" },
  { href: "/#features", label: "Features", badge: "New" },
  { href: "/#agents", label: "DESIGN.md" },
  { href: "/#pricing", label: "Pricing" },
  { href: REPO_URL, label: "GitHub", external: true },
];

export async function Nav({ marketing = true }: { marketing?: boolean }) {
  const user = await currentUser();
  return (
    <header className="relative z-30 flex h-[72px] items-center justify-between px-5 sm:px-8">
      <Logo byline />
      {marketing && (
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-[16px] text-muted lg:flex">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} target={l.external ? "_blank" : undefined} className="relative transition-colors hover:text-white">
              {l.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-accent">{l.badge}</span>}
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <>
            {marketing && <Link href="/dashboard" className="btn btn-sm btn-accent">Dashboard</Link>}
            <UserMenu user={user} />
          </>
        ) : (
          <>
            <Link href="/login" className="hidden px-2 text-[16px] text-muted transition-colors hover:text-white sm:block">Login</Link>
            <Link href="/signup" className="btn btn-sm btn-accent">Start cloning</Link>
          </>
        )}
        {!marketing && <Link href={REPO_URL} target="_blank" className="hidden text-muted hover:text-white sm:block" aria-label="GitHub"><GithubIcon /></Link>}
      </div>
    </header>
  );
}
