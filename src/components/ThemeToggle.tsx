"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const THEME_KEY = "designdna:theme";

/** Runs before paint (inlined in <head>) so there's no flash of the wrong theme. Dark is the default. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'dark';var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(t)}catch(e){document.documentElement.classList.add('dark')}})()`;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => setTheme(document.documentElement.classList.contains("light") ? "light" : "dark"), []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    const d = document.documentElement;
    d.classList.remove("light", "dark");
    d.classList.add(next);
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  };
  return (
    <button onClick={toggle} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} title="Toggle theme"
      className={`grid h-9 w-9 place-items-center text-muted transition-colors hover:bg-white/10 hover:text-white ${className}`}>
      {theme === "light" ? <Moon className="h-[17px] w-[17px]" strokeWidth={1.75} /> : <Sun className="h-[17px] w-[17px]" strokeWidth={1.75} />}
    </button>
  );
}
