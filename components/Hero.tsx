"use client";

import dynamic from "next/dynamic";
import { profile } from "@/lib/data";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function Hero() {
  return (
    <section id="top" className="relative flex h-svh flex-col justify-end overflow-hidden px-4 pb-6 md:px-10 md:pb-8">
      <Scene />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#050505] to-transparent" />

      <div className="pointer-events-none relative z-10 grid gap-6 border-t border-white/15 pt-5 font-mono text-xs uppercase tracking-widest text-zinc-400 md:grid-cols-3">
        <p data-fade>{profile.role}</p>
        <p data-fade className="normal-case tracking-normal text-zinc-300 md:text-sm">{profile.tagline}</p>
        <p data-fade className="flex items-center gap-2 md:justify-self-end">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-300 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-lime-300" />
          </span>
          Available for work
        </p>
      </div>

      <h1 data-hero-title className="pointer-events-none relative z-10 mt-4 whitespace-nowrap text-[16.4vw] font-bold leading-[0.8] tracking-[-0.06em]">
        {profile.name.toUpperCase()}
      </h1>
    </section>
  );
}
