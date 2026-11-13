import Link from "next/link";

/** Mark: two offset brackets forming a "copy" glyph, orange inner square. */
export function Mark({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path d="M2 6V2h4M14 2h4v4M18 14v4h-4M6 18H2v-4" stroke="currentColor" strokeWidth="2" />
      <rect x="7" y="7" width="6" height="6" fill="#fb460d" />
    </svg>
  );
}

export function Logo({ size = "md", byline = false }: { size?: "sm" | "md"; byline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-white">
      <Mark className={size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      <span className={`font-medium tracking-[-0.03em] ${size === "sm" ? "text-[16px]" : "text-[20px]"}`}>DesignDNA</span>
      {byline && <span className="mt-1 hidden text-[10px] text-muted sm:inline">by Piyush Kumar</span>}
    </Link>
  );
}
