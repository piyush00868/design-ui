import Link from "next/link";
import { currentUser } from "@/lib/server/auth";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { GithubIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
export { GithubIcon };

export const REPO_URL = "https://github.com/piyush00868/design-ui";

export async function Nav({ marketing = true }: { marketing?: boolean }) {
  const user = await currentUser();
  return (
    <header className="relative z-20 mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <Logo />
      {marketing && (
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#how" className="hover:text-white">How it works</Link>
          <Link href="/#output" className="hover:text-white">What you get</Link>
          <Link href="/#faq" className="hover:text-white">FAQ</Link>
        </nav>
      )}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link href={REPO_URL} target="_blank" className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted hover:text-white sm:flex">
          <GithubIcon /> GitHub
        </Link>
        {user ? (
          <>
            {marketing && <Link href="/dashboard" className="rounded-lg border border-line-strong bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10">Dashboard</Link>}
            <UserMenu user={user} />
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-white">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-200">Get started</Link>
          </>
        )}
      </div>
    </header>
  );
}
