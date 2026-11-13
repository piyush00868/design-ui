import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/components/ThemeToggle";

const grotesk = Inter_Tight({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DesignDNA · Clone any website with AI",
  description:
    "Paste a URL or drop a screenshot. Get the colors, typography, spacing and components as a DESIGN.md, Tailwind config, CSS variables and recreated code.",
  openGraph: {
    title: "DesignDNA · Clone any website with AI",
    description: "Extract any website's design system in seconds. Free for students and developers.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={`${grotesk.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
