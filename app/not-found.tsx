import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/lib/data";

export const metadata: Metadata = { title: `404 — ${profile.name}` };

export default function NotFound() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-16">
      <div className="glow absolute inset-0 -z-10" />
      <div className="w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-300">Error 404</p>
        <h1 data-text="404" className="glitch mt-4 text-[38vw] font-bold leading-[0.8] tracking-[-0.06em] md:text-[20vw]">
          404
        </h1>
        <div className="mt-10 rounded-xl border border-white/10 bg-zinc-950/80 p-6 font-mono text-sm leading-relaxed md:text-base">
          <p>
            <span className="text-zinc-500">$</span> open ./this-page
          </p>
          <p className="text-[#ff2bd6]">Segmentation fault (core dumped)</p>
          <p className="text-zinc-400">This page doesn&apos;t exist, or it got garbage-collected.</p>
          <p className="mt-4">
            <span className="text-zinc-500">$</span>{" "}
            <Link href="/" className="text-lime-300 underline-offset-4 hover:underline">
              cd ~
            </Link>
            <span className="caret ml-1 inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-lime-300" />
          </p>
        </div>
      </div>
    </main>
  );
}
