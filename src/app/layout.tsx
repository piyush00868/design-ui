import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DesignDNA · Turn any website into a DESIGN.md",
  description:
    "Paste a URL or drop a screenshot. Get the colors, typography, spacing and components as a DESIGN.md, Tailwind config, CSS variables and recreated code.",
  openGraph: {
    title: "DesignDNA · Turn any website into a DESIGN.md",
    description: "Extract any website's design system in seconds. Free for students and developers.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
