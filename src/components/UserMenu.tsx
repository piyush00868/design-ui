"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, LogOut } from "lucide-react";

export function UserMenu({ user }: { user: { name: string | null; email: string; avatar_url: string | null } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#6d82ff] to-[#ff5c9d] text-sm font-medium text-white ring-2 ring-white/10" aria-label="Account menu">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
      </button>
      {open && (
        <div className="glass absolute right-0 top-10 z-50 w-56 rounded-2xl p-1.5 text-sm fade-up">
          <div className="px-3 py-2">
            <div className="truncate font-medium text-white">{user.name || "You"}</div>
            <div className="truncate text-xs text-faint">{user.email}</div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted hover:bg-white/5 hover:text-white"><LayoutGrid className="h-4 w-4" /> My projects</Link>
          <form action="/api/auth/logout" method="post">
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-muted hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Log out</button>
          </form>
        </div>
      )}
    </div>
  );
}
