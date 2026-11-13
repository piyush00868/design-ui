import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
      <span className={`${s} relative grid place-items-center rounded-lg bg-gradient-to-br from-[#6d82ff] via-[#ff5c9d] to-[#ff9d4d] shadow-[0_0_24px_rgba(255,92,157,0.45)]`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#fff]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M7 4c0 6 10 10 10 16M17 4c0 6-10 10-10 16M8.5 8h7M8.5 16h7" />
        </svg>
      </span>
      <span className={size === "sm" ? "text-[15px]" : "text-[17px]"}>DesignDNA</span>
    </Link>
  );
}
