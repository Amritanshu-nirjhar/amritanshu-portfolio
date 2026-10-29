"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { profile, projects } from "@/lib/data";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const SECTIONS = ["about", "work", "wins", "contact"];
const CHIPS = ["cd ~", "ls", "projects", "whoami", "help"];

type Line = { text: ReactNode; tone?: "dim" | "err" | "ok" | "cmd" };

const TONE = { dim: "text-zinc-500", err: "text-[#ff2bd6]", ok: "text-lime-300", cmd: "text-zinc-100" };

export default function NotFoundShell() {
  const path = usePathname();
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Crash report types itself out, line by line.
  useEffect(() => {
    const boot: Line[] = [
      { text: `$ GET ${path}`, tone: "cmd" },
      { text: "TypeError: Cannot read properties of undefined (reading 'page')", tone: "err" },
      { text: "    at Router.resolve (amritanshu.ts:404:1)", tone: "dim" },
      { text: "    at async Portfolio.render (amritanshu.ts:200:7)", tone: "dim" },
      { text: "Segmentation fault (core dumped)", tone: "err" },
      { text: "Type 'help' for commands, or 'cd ~' to go home.", tone: "ok" },
    ];
    const timers = boot.map((l, i) => setTimeout(() => setLines((prev) => [...prev, l]), 250 + i * 220));
    return () => timers.forEach(clearTimeout);
  }, [path]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  // The 404 digits drift with the pointer, each at a different depth.
  const onMove = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--mx", String(e.clientX / innerWidth - 0.5));
    el.style.setProperty("--my", String(e.clientY / innerHeight - 0.5));
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    const out: Line[] = [{ text: `guest@amritanshu:~$ ${cmd}`, tone: "cmd" }];
    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");

    if (!cmd) return setLines((l) => [...l, ...out]);
    setHistory((h) => [cmd, ...h]);
    setCursor(-1);

    switch (name) {
      case "help":
        out.push(
          { text: "cd ~            go home" },
          { text: "cd <section>    jump to about · work · wins · contact" },
          { text: "ls              list sections" },
          { text: "projects        things I've shipped" },
          { text: "whoami          who's asking" },
          { text: "contact         get in touch" },
          { text: "clear           clear the screen" },
        );
        break;
      case "ls":
        out.push({ text: SECTIONS.map((s) => `${s}/`).join("   "), tone: "ok" });
        break;
      case "cd":
      case "exit":
      case "home": {
        const target = arg.replace(/^[./~]+|\/$/g, "");
        if (name === "cd" && target && !SECTIONS.includes(target)) {
          out.push({ text: `cd: no such directory: ${arg}`, tone: "err" });
          break;
        }
        out.push({ text: target ? `→ /#${target}` : "→ ~", tone: "ok" });
        setTimeout(() => router.push(target ? `/#${target}` : "/"), 350);
        break;
      }
      case "projects":
        projects.forEach((p) =>
          out.push({
            text: (
              <>
                <span className="text-lime-300">{p.name.padEnd(18)}</span>
                <a href={p.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {new URL(p.url).host}
                </a>
              </>
            ),
          }),
        );
        break;
      case "whoami":
        out.push({ text: "guest. (recruiters, you're especially welcome.)" });
        break;
      case "contact":
      case "email":
        out.push({
          text: (
            <a href={`mailto:${profile.email}`} className="text-lime-300 underline-offset-4 hover:underline">
              {profile.email}
            </a>
          ),
        });
        break;
      case "hire":
        out.push({ text: "Excellent decision. Opening mail client…", tone: "ok" });
        setTimeout(() => (location.href = `mailto:${profile.email}?subject=Let's work together`), 500);
        break;
      case "sudo":
        out.push({ text: "Nice try. This incident will be reported.", tone: "err" });
        break;
      case "rm":
        out.push({ text: "Permission denied. Also… why?", tone: "err" });
        break;
      case "clear":
        return setLines([]);
      default:
        out.push({ text: `command not found: ${name}. Try 'help'.`, tone: "err" });
    }
    setLines((l) => [...l, ...out]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(-1, Math.min(history.length - 1, cursor + (e.key === "ArrowUp" ? 1 : -1)));
      setCursor(next);
      setInput(next < 0 ? "" : history[next]);
    }
  };

  return (
    <main ref={stageRef} onPointerMove={onMove} className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <Scene />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/40 to-[#050505]" />

      <div className="relative mx-auto grid min-h-svh max-w-6xl content-center gap-10 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:items-center md:px-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-300">Error 404 · page not found</p>
          <h1 data-text="404" className="glitch mt-4 select-none text-[38vw] font-bold leading-[0.8] tracking-[-0.06em] md:text-[17vw]">
            {["4", "0", "4"].map((d, i) => (
              <span
                key={i}
                className="inline-block transition-transform duration-300 ease-out"
                style={{ transform: `translate(calc(var(--mx, 0) * ${(i + 1) * 28}px), calc(var(--my, 0) * ${(i + 1) * 20}px))` }}
              >
                {d}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-sm text-zinc-400">
            This page doesn&apos;t exist, or it got garbage-collected. The terminal still works though.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/90 shadow-2xl shadow-lime-300/10 backdrop-blur" onClick={() => inputRef.current?.focus()}>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-xs text-zinc-500">guest@amritanshu — zsh</span>
          </div>
          <div className="h-80 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed md:text-sm">
            {lines.map((l, i) => (
              <p key={i} className={`whitespace-pre-wrap ${TONE[l.tone ?? "cmd"]}`}>
                {l.text}
              </p>
            ))}
            <label className="flex items-center gap-2">
              <span className="shrink-0 text-lime-300">guest@amritanshu:~$</span>
              <input
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-label="Terminal command"
                className="w-full bg-transparent text-zinc-100 caret-lime-300 outline-none"
              />
            </label>
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => run(c)} className="rounded-full border border-white/15 px-3 py-1 font-mono text-xs text-zinc-300 transition-colors hover:border-lime-300 hover:text-lime-300">
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
