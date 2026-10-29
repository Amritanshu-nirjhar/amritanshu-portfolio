import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { profile } from "@/lib/data";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} antialiased`}>
      <body>
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
