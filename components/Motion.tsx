"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { profile } from "@/lib/data";
import { sfx, startSound, stopSound } from "@/lib/sound";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const BOOT = [
  "AMRITANSHU OS v20.26 — booting…",
  "Mounted /dev/brain",
  "Started coffee.service",
  "Loaded DSA modules (342 problems solved)",
  "Linked node_modules (it's heavy)",
  "Reached target: Developer",
];
// The intro's "source code", pre-tokenised for syntax colours.
const SRC: [string, string][][] = [
  [["kw", "class "], ["ty", "Amritanshu "], ["kw", "extends "], ["ty", "Student "], ["p", "{"]],
  [["p", "  major "], ["op", "= "], ["str", '"CSE"'], ["p", ";"]],
  [["p", "  stack "], ["op", "= "], ["p", "["], ["str", '"DSA"'], ["p", ", "], ["str", '"Web"'], ["p", ", "], ["str", '"3D"'], ["p", "];"]],
  [["kw", "  async "], ["fn", "ship"], ["p", "() { "], ["kw", "await "], ["p", "this."], ["fn", "build"], ["p", "(); }"]],
  [["p", "}"]],
];
const TOKEN: Record<string, string> = { kw: "text-[#ff2bd6]", ty: "text-lime-300", str: "text-sky-300", fn: "text-amber-200", op: "text-zinc-500", p: "text-zinc-200" };
const DS = [3, 1, 4, 1, 5, 9, 2];
const BARS = Array.from({ length: 28 }, (_, i) => i);
const SHUFFLED = BARS.map((i) => ((i * 11) % 28) + 1);
const SQUARES = Array.from({ length: 12 }, (_, i) => i);
// Neural net: 4 layers, nodes spread vertically around the middle.
const LAYERS = [4, 6, 6, 3].map((n, l) => Array.from({ length: n }, (_, j) => ({ l, x: 12 + l * 25.3, y: 28 + (j - (n - 1) / 2) * 8.5 })));
const LINKS = LAYERS.slice(0, -1).flatMap((layer, l) => layer.flatMap((a) => LAYERS[l + 1].map((b) => ({ l, a, b }))));
// Binary rain: deterministic so server and client render the same digits.
const RAIN = Array.from({ length: 26 }, (_, i) => Array.from({ length: 40 }, (_, j) => ((i * 31 + j * 17) % 7 > 3 ? "1" : "0")).join(""));
// Pathfinding maze: BFS from START to END around two walls, computed once.
const GW = 16, GH = 9;
const START = 4 * GW + 2, END = 4 * GW + 13;
const WALLS = new Set([...Array.from({ length: 7 }, (_, r) => r * GW + 7), ...Array.from({ length: 7 }, (_, r) => (r + 2) * GW + 10)]);
const DIST: number[] = Array(GW * GH).fill(-1);
const PREV: number[] = Array(GW * GH).fill(-1);
{
  const queue = [START];
  DIST[START] = 0;
  while (queue.length) {
    const c = queue.shift()!;
    const x = c % GW, y = Math.floor(c / GW);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * GW + nx;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || WALLS.has(n) || DIST[n] >= 0) continue;
      DIST[n] = DIST[c] + 1;
      PREV[n] = c;
      queue.push(n);
    }
  }
}
const PATH: number[] = [];
for (let c = END; c !== -1; c = PREV[c]) PATH.unshift(c);

// Drives every animation on the page via data attributes, so sections stay server components:
// data-hero-title, data-fade, data-heading, data-reveal, data-scrub-words, data-count, data-line
// Also renders the preloader and the ~20s cinematic intro that plays once per session.
export default function Motion() {
  useEffect(() => {
    const loader = document.getElementById("loader")!;
    const intro = document.getElementById("intro")!;
    const q = gsap.utils.selector(intro);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([loader, intro], { display: "none" });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      let seen = false;
      try {
        seen = sessionStorage.getItem("intro") === "1";
      } catch {}

      const count = { v: 0 };
      const num = loader.querySelector("span")!;
      const title = SplitText.create("[data-hero-title]", { type: "chars", mask: "chars" });
      const tl = gsap.timeline();

      // Preloader: count to 100, then wipe away.
      // Already watched this session: hide the intro now, not after the loader, or its raw layers flash through.
      if (seen) gsap.set(intro, { display: "none" });

      tl.to(count, { v: 100, duration: seen ? 0.6 : 1.4, ease: "power2.inOut", onUpdate: () => (num.textContent = String(Math.round(count.v))) });

      // First visit: wait for a click so the intro can play with sound (browsers block autoplay audio).
      if (!seen) {
        const gate = loader.querySelector("[data-gate]")!;
        tl.to(gate, { autoAlpha: 1, duration: 0.5 }).addPause().to(gate, { autoAlpha: 0, duration: 0.3 });
        gate.querySelectorAll<HTMLButtonElement>("button").forEach((btn) =>
          btn.addEventListener("click", () => {
            if (btn.dataset.sound === "1") startSound();
            tl.play();
          }),
        );
      }

      tl.to(loader, { yPercent: -100, duration: 0.9, ease: "expo.inOut" })
        .set(loader, { display: "none" });

      if (!seen) {
        lenis.stop();
        const intro0 = tl.duration() - 0.6;
        const time = q("[data-i=time]")[0];
        const rand = gsap.utils.random;
        const at = (t: number) => `intro+=${t}`;
        const ticks = (from: number, n: number, gap: number) => {
          for (let k = 0; k < n; k++) tl.call(() => sfx.tick(), [], at(from + k * gap));
        };
        const glitch = { textShadow: "0.06em 0 #c6f432, -0.06em 0 #ff2bd6", skewX: -12 };
        const unglitch = { textShadow: "0em 0 #c6f432, 0em 0 #ff2bd6", skewX: 0, duration: 0.25, ease: "power3.out" };
        const u = Math.min(innerWidth, innerHeight) / 10; // one data-structure box + gap

        tl.addLabel("intro", intro0).call(() => sfx.music(), [], at(0));

        // 0–1.6s: boot log.
        const boot = q("[data-i=boot]");
        q("[data-i=bootline]").forEach((l, i) => {
          tl.call(() => sfx.tick(), [], at(0.1 + i * 0.17)).fromTo(l, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.12, immediateRender: false }, at(0.1 + i * 0.17));
        });
        tl.to(boot, { yPercent: -30, opacity: 0, duration: 0.18, ease: "expo.in" }, at(1.4));

        // 1.6–3.2s: editor window flips in, the class types itself out.
        const editor = q("[data-i=editor]");
        const code = SplitText.create(q("[data-i=src]"), { type: "chars" }).chars;
        tl.call(() => sfx.hit(0.5), [], at(1.6))
          .fromTo(editor, { rotateX: 45, y: 120, scale: 0.85, opacity: 0 }, { rotateX: 0, y: 0, scale: 1, opacity: 1, duration: 0.4, ease: "expo.out", immediateRender: false }, at(1.6))
          .fromTo(code, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.0075, immediateRender: false }, at(1.85));
        ticks(1.85, 16, 0.06);
        tl.to(editor, { rotateX: -35, y: -80, scale: 0.9, opacity: 0, duration: 0.2, ease: "expo.in" }, at(3.0));

        // 3.2–4.8s: compile. Counter + progress bar, then BUILD SUCCESSFUL slams in.
        const pct = q("[data-i=pct]")[0];
        const prog = { v: 0 };
        tl.set(q("[data-i=compile]"), { opacity: 1 }, at(3.2))
          .fromTo(q("[data-i=bar-fill]"), { scaleX: 0 }, { scaleX: 1, duration: 0.85, ease: "power4.inOut" }, at(3.25))
          .to(prog, { v: 100, duration: 0.85, ease: "power4.inOut", onUpdate: () => (pct.textContent = `${Math.round(prog.v)}%`) }, at(3.25));
        ticks(3.25, 8, 0.1);
        tl.call(() => sfx.hit(1), [], at(4.15))
          .fromTo(q("[data-i=stamp]"), { scale: 2.6, rotate: -14, opacity: 0 }, { scale: 1, rotate: -4, opacity: 1, duration: 0.25, ease: "back.out(2.5)", immediateRender: false }, at(4.15))
          .fromTo(q("[data-i=compile-flash]"), { opacity: 0.8 }, { opacity: 0, duration: 0.3, immediateRender: false }, at(4.15))
          .to(q("[data-i=compile]"), { scale: 1.3, opacity: 0, duration: 0.18, ease: "expo.in" }, at(4.6));

        // 4.8–6.4s: the same boxes morph array → linked list → stack, then pop.
        const boxes = q("[data-i=box]");
        const links = q("[data-i=link]");
        const dsLabel = q("[data-i=ds-label]")[0];
        gsap.set(links, { x: (i) => (i - 2.5) * u * 1.8 - u * 0.375, width: u * 0.75 });
        tl.call(() => { dsLabel.textContent = "int[] arr"; sfx.hit(0.5); }, [], at(4.8))
          .fromTo(dsLabel, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, at(4.8))
          .fromTo(boxes, { x: (i) => (i - 3) * u, y: 0, scale: 0, opacity: 1 }, { scale: 1, duration: 0.25, ease: "back.out(2)", stagger: 0.03, immediateRender: false }, at(4.8))
          .call(() => { dsLabel.textContent = "LinkedList<int>"; sfx.whoosh(); }, [], at(5.25))
          .to(boxes, { x: (i) => (i - 3) * u * 1.8, duration: 0.3, ease: "expo.inOut" }, at(5.25))
          .fromTo(links, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.12, stagger: 0.03, immediateRender: false }, at(5.5))
          .call(() => { dsLabel.textContent = "Stack<int>  push() / pop()"; sfx.whoosh(); }, [], at(5.8))
          .to(links, { opacity: 0, duration: 0.08 }, at(5.8))
          .to(boxes, { x: 0, y: (i) => (3 - i) * u * 0.82 + u * 0.4, rotate: () => rand(-4, 4), duration: 0.3, ease: "expo.inOut", stagger: 0.02 }, at(5.85))
          .call(() => sfx.hit(0.8), [], at(6.18))
          .to(boxes[6], { y: "-=" + u * 6, rotate: 25, duration: 0.2, ease: "expo.in" }, at(6.18))
          .to(boxes.slice(0, 6), { scale: 0, duration: 0.12, stagger: 0.015 }, at(6.25))
          .to(dsLabel, { opacity: 0, duration: 0.08 }, at(6.3));

        // 6.4–8s: BFS floods the maze, then the shortest path lights up.
        const cells = q("[data-i=cell]");
        const reached = cells.filter((c) => Number((c as HTMLElement).dataset.d) > 0);
        const path = PATH.map((n) => cells[n]);
        tl.fromTo(cells, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.15, stagger: { grid: [GH, GW], from: "center", amount: 0.15 }, immediateRender: false }, at(6.4))
          .fromTo(q("[data-i=bfs-label]"), { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, at(6.4))
          .to(reached, { backgroundColor: "#365314", duration: 0.06, stagger: (i, el) => Number(el.dataset.d) * 0.017 }, at(6.6));
        ticks(6.6, 12, 0.045);
        tl.call(() => sfx.hit(0.8), [], at(7.2))
          .to(path, { backgroundColor: "#c6f432", scale: 1.15, duration: 0.08, stagger: 0.012 }, at(7.2))
          .to([cells, q("[data-i=bfs-label]")], { opacity: 0, duration: 0.15 }, at(7.85));

        // 8–9.6s: quickSort. Shuffled bars, comparison sweeps, sorted, verified.
        const bars = q("[data-i=bar]");
        const sortLabel = q("[data-i=sort-label]");
        tl.fromTo(bars, { scaleY: 0, opacity: 1 }, { scaleY: (i) => SHUFFLED[i] / 28, duration: 0.2, ease: "back.out(1.5)", stagger: { each: 0.006, from: "center" }, immediateRender: false }, at(8))
          .fromTo(sortLabel, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, at(8))
          .to(bars, { backgroundColor: "#ff2bd6", duration: 0.04, yoyo: true, repeat: 1, stagger: 0.012 }, at(8.25))
          .to(bars, { backgroundColor: "#ff2bd6", duration: 0.04, yoyo: true, repeat: 1, stagger: { each: 0.012, from: "end" } }, at(8.55));
        ticks(8.25, 10, 0.06);
        tl.set(bars, { clearProps: "backgroundColor" }, at(8.88))
          .call(() => sfx.hit(0.8), [], at(8.9))
          .to(bars, { scaleY: (i) => (i + 1) / 28, duration: 0.3, ease: "expo.out", stagger: 0.008 }, at(8.9))
          .to(bars, { backgroundColor: "#c6f432", duration: 0.04, stagger: 0.007 }, at(9.2))
          .to([bars, sortLabel], { scaleY: 0, opacity: 0, duration: 0.15, ease: "expo.in" }, at(9.45));

        // 9.6–11.2s: recursion tunnel. Nested squares zoom forever while f(n) counts down.
        const squares = q("[data-i=sq]");
        const fn = q("[data-i=fn]")[0];
        tl.fromTo(squares, { scale: 0, rotate: 0, opacity: 1 }, { scale: (i) => 0.75 ** i, rotate: (i) => i * 9, duration: 0.3, ease: "expo.out", stagger: { each: 0.02, from: "end" }, immediateRender: false }, at(9.6))
          .to(squares, { scale: (i) => 0.75 ** (i - 7), rotate: (i) => i * 9 + 63, duration: 1.15, ease: "power2.in" }, at(9.9));
        [6, 5, 4, 3, 2, 1, 0].forEach((n, k) => {
          tl.call(() => { fn.textContent = `f(${n})`; sfx.tick(); }, [], at(9.75 + k * 0.17));
        });
        tl.set(fn, { opacity: 1 }, at(9.75))
          .call(() => { fn.textContent = "base case ✓"; sfx.hit(0.8); }, [], at(10.95))
          .fromTo(fn, { ...glitch, scale: 1.3 }, { ...unglitch, scale: 1 }, at(10.95))
          .to([squares, fn], { opacity: 0, duration: 0.12 }, at(11.1));

        // 11.2–12.8s: neural network. Layers draw in, signals pulse through, output fires.
        const net = q("[data-i=net]");
        tl.set(net, { opacity: 1 }, at(11.2))
          .fromTo(q("[data-i=net-label]"), { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, at(11.2));
        for (let l = 0; l < LAYERS.length; l++) {
          tl.fromTo(q(`[data-i=neuron][data-l="${l}"]`), { attr: { r: 0 } }, { attr: { r: 1.7 }, duration: 0.18, ease: "back.out(3)", stagger: 0.02 }, at(11.2 + l * 0.08))
            .fromTo(q(`[data-i=wire][data-l="${l}"]`), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.2, stagger: { amount: 0.1, from: "random" } }, at(11.25 + l * 0.08));
        }
        for (let wave = 0; wave < 2; wave++) {
          for (let l = 0; l < LAYERS.length - 1; l++) {
            const t = 11.65 + wave * 0.45 + l * 0.14;
            tl.call(() => sfx.tick(), [], at(t))
              .fromTo(q(`[data-i=pulse][data-l="${l}"]`), { strokeDashoffset: 0.12 }, { strokeDashoffset: -1, duration: 0.16, ease: "none", stagger: { amount: 0.06, from: "random" } }, at(t));
          }
        }
        tl.call(() => sfx.hit(0.9), [], at(12.45))
          .to(q('[data-i=neuron][data-l="3"]'), { fill: "#c6f432", attr: { r: 2.6 }, duration: 0.1, stagger: 0.03 }, at(12.45))
          .to([net, q("[data-i=net-label]")], { scale: 0.85, opacity: 0, duration: 0.15, ease: "expo.in" }, at(12.65));

        // 12.8–14.4s: binary rain while the noise decodes into a greeting.
        const hello = q("[data-i=hello]")[0];
        tl.fromTo(q("[data-i=rain]"), { yPercent: -110 }, { yPercent: 110, duration: 1.5, ease: "power1.in", stagger: { amount: 0.3, from: "random" } }, at(12.8))
          .set(hello, { opacity: 1 }, at(12.85))
          .to(hello, { duration: 0.75, scrambleText: { text: "Hello, World!", chars: "01", revealDelay: 0.2, speed: 0.8 } }, at(12.85))
          .call(() => sfx.hit(0.8), [], at(13.6))
          .fromTo(hello, glitch, unglitch, at(13.6))
          .to(hello, { duration: 0.5, scrambleText: { text: "I'm Amritanshu.", chars: "01<>/{};", speed: 1 } }, at(13.75))
          .to(hello, { opacity: 0, y: -40, duration: 0.15, ease: "expo.in" }, at(14.25));
        ticks(12.85, 14, 0.1);

        // 14.4–16s: the name's letters fly in from 3D space, lock, shatter.
        const chars = q("[data-i=ch]");
        tl.fromTo(chars, {
            x: () => rand(-600, 600), y: () => rand(-400, 400), z: () => rand(-1500, 600),
            rotateX: () => rand(-180, 180), rotateY: () => rand(-180, 180), opacity: 0,
          }, {
            x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, opacity: 1,
            duration: 0.55, ease: "expo.out", stagger: { amount: 0.15, from: "random" }, immediateRender: false,
          }, at(14.4))
          .call(() => sfx.hit(1), [], at(14.8))
          .fromTo(chars, glitch, unglitch, at(15.1))
          .call(() => sfx.whoosh(), [], at(15.55))
          .to(chars, {
            x: () => rand(-900, 900), y: () => rand(-600, 600), z: () => rand(200, 1200), rotate: () => rand(-180, 180), opacity: 0,
            duration: 0.35, ease: "expo.in", stagger: { amount: 0.08, from: "center" },
          }, at(15.6));

        // 16–16.6s: the music breaks; a lone cursor blinks.
        tl.fromTo(q("[data-i=caret]"), { opacity: 0 }, { opacity: 1, duration: 0.05, repeat: 5, yoyo: true, repeatDelay: 0.05, immediateRender: false }, at(16))
          .set(q("[data-i=caret]"), { opacity: 0 }, at(16.58));

        // 16.6–19s: the drop. Lime panel, name lands.
        tl.call(() => sfx.impact(), [], at(16.6))
          .fromTo(q("[data-i=panel]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: "expo.inOut" }, at(16.6))
          .from(q("[data-i=name]"), { scale: 1.5, opacity: 0, filter: "blur(20px)", duration: 0.9, ease: "expo.out" }, at(16.75))
          .from(q("[data-i=panel-meta]"), { opacity: 0, y: 10, duration: 0.4, stagger: 0.08 }, at(17.1));

        // 19–20s: the whole intro wipes up to reveal the site.
        tl.call(() => sfx.whoosh(), [], at(18.9))
          .to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, at(19))
          .set(intro, { display: "none" })
          .add(() => {
            lenis.start();
            stopSound();
            try {
              sessionStorage.setItem("intro", "1");
            } catch {}
          });

        tl.eventCallback("onUpdate", () => {
          const s = Math.max(0, Math.min(20, tl.time() - intro0));
          time.textContent = `00:${String(Math.floor(s)).padStart(2, "0")} / 00:20`;
        });

        q("[data-i=skip]")[0].addEventListener("click", () => {
          stopSound(); // before seeking, so skipped cues stay silent
          tl.seek("hero", false);
        });
      }

      tl.addLabel("hero")
        .from(title.chars, { yPercent: 110, duration: 1.1, stagger: 0.04, ease: "expo.out" }, seen ? "-=0.4" : "-=0.5")
        .from("[data-fade]", { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, "-=0.7");

      // Cursor follows the pointer with a little lag and grows over anything clickable.
      const cursor = document.querySelector<HTMLElement>(".cursor")!;
      const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
      const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
      const move = (e: PointerEvent) => {
        cx(e.clientX);
        cy(e.clientY);
        cursor.style.opacity = "1";
        cursor.classList.toggle("big", !!(e.target as Element).closest("a, button"));
      };
      window.addEventListener("pointermove", move);

      gsap.utils.toArray<HTMLElement>("[data-heading]").forEach((el) => {
        const split = SplitText.create(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, { yPercent: 100, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.from(els, { opacity: 0, y: 60, duration: 1, stagger: 0.12, ease: "power3.out" }),
      });

      gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
        const split = SplitText.create(el, { type: "words" });
        gsap.from(split.words, { opacity: 0.15, stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const n = { v: 0 };
        const end = Number(el.dataset.count);
        gsap.to(n, { v: end, duration: 2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: () => (el.textContent = String(Math.round(n.v))) });
      });

      gsap.utils.toArray<HTMLElement>("[data-line]").forEach((el) => {
        gsap.from(el, { scaleY: 0, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 60%", scrub: true } });
      });

      return () => {
        window.removeEventListener("pointermove", move);
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      <div className="cursor" aria-hidden />
      <div id="loader" className="fixed inset-0 z-[70] flex items-end justify-end bg-black p-6 md:p-10">
        <div data-gate className="invisible absolute inset-0 grid place-content-center justify-items-center gap-5 opacity-0">
          <button data-sound="1" className="rounded-full border border-lime-300/60 px-7 py-3 font-mono text-xs uppercase tracking-widest text-lime-300 transition-colors hover:bg-lime-300 hover:text-black">
            Enter with sound ♪
          </button>
          <button data-sound="0" className="font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-white">
            Enter without sound
          </button>
        </div>
        <span className="text-[20vw] font-bold leading-none tracking-tighter">0</span>
      </div>

      <div id="intro" className="fixed inset-0 z-[60] overflow-hidden bg-[#050505]" aria-hidden>
        <div data-i="meta" className="absolute inset-x-4 top-5 flex justify-between font-mono text-xs uppercase tracking-widest text-zinc-500 md:inset-x-10">
          <span>{profile.name} — Portfolio</span>
          <span data-i="time">00:00 / 00:20</span>
        </div>

        <div data-i="boot" className="pointer-events-none absolute inset-0 flex flex-col justify-center px-6 font-mono text-[3.2vw] leading-relaxed md:px-[12vw] md:text-[1.6vw]">
          {BOOT.map((line, i) => (
            <p key={i} data-i="bootline" className="opacity-0">
              {i === 0 ? <span className="text-zinc-400">{line}</span> : <><span className="text-lime-300">[  OK  ]</span> <span className="text-zinc-200">{line}</span></>}
              {i === BOOT.length - 1 && <span className="ml-1 inline-block h-[1em] w-[0.6em] translate-y-[0.15em] animate-pulse bg-lime-300" />}
            </p>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center px-4 [perspective:1200px]">
          <div data-i="editor" className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-zinc-950 opacity-0 shadow-2xl shadow-lime-300/10">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-zinc-500">amritanshu.ts</span>
            </div>
            <div data-i="src" className="p-6 font-mono text-[2.6vw] leading-relaxed md:text-[1.7vw]">
              {SRC.map((line, i) => (
                <p key={i} className="whitespace-pre">
                  <span className="mr-6 select-none text-zinc-700">{i + 1}</span>
                  {line.map(([t, txt], j) => <span key={j} className={TOKEN[t]}>{txt}</span>)}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div data-i="compile" className="pointer-events-none absolute inset-0 grid place-items-center opacity-0">
          <div data-i="compile-flash" className="absolute inset-0 bg-lime-300 opacity-0" />
          <div className="relative w-[80vw] max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">tsc amritanshu.ts --build</p>
            <p data-i="pct" className="mt-2 font-mono text-[18vw] font-bold leading-none tracking-tighter md:text-[11vw]">0%</p>
            <div className="mt-4 h-1 w-full bg-zinc-800">
              <div data-i="bar-fill" className="h-full w-full origin-left bg-lime-300" />
            </div>
            <p data-i="stamp" className="absolute -right-2 top-1/2 rounded-md border-4 border-lime-300 bg-lime-300 px-4 py-2 font-mono text-[4vw] font-bold uppercase text-black opacity-0 md:text-[2.6vw]">
              Build successful
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0">
          <p data-i="ds-label" className="absolute inset-x-0 top-[7%] text-center font-mono text-[3.6vw] text-zinc-400 opacity-0 md:text-[1.8vw]">int[] arr</p>
          {DS.map((v, i) => (
            <div key={i} data-i="box" className="absolute left-1/2 top-1/2 -ml-[4.5vmin] -mt-[4.5vmin] grid size-[9vmin] place-items-center rounded-md border-2 border-lime-300 bg-zinc-950 font-mono text-[4vmin] font-bold text-lime-300 opacity-0">
              {v}
            </div>
          ))}
          {DS.slice(1).map((_, i) => (
            <div key={i} data-i="link" className="absolute left-1/2 top-1/2 h-[2px] origin-left bg-zinc-100 opacity-0 after:absolute after:-right-1 after:-top-[5px] after:border-y-[6px] after:border-l-[8px] after:border-y-transparent after:border-l-zinc-100" />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p data-i="bfs-label" className="absolute top-[6%] font-mono text-[3.4vw] text-zinc-400 opacity-0 md:text-[1.6vw]">bfs(start, goal) → shortest path</p>
          <div className="grid aspect-[16/9] w-[min(92vw,140vh)] gap-[3px]" style={{ gridTemplateColumns: `repeat(${GW}, 1fr)` }}>
            {DIST.map((d, n) => (
              <div
                key={n}
                data-i="cell"
                data-d={d}
                className={`rounded-[3px] opacity-0 ${n === START ? "bg-lime-300" : n === END ? "bg-zinc-100" : WALLS.has(n) ? "bg-zinc-600" : "bg-zinc-900"}`}
              />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-[0.8vw] pb-[18vh]">
          <p data-i="sort-label" className="absolute top-[12%] font-mono text-[3.4vw] text-zinc-400 opacity-0 md:text-[1.6vw]">quickSort(arr) → O(n log n)</p>
          {BARS.map((i) => (
            <div key={i} data-i="bar" className={`h-[60vh] w-[2vw] origin-bottom opacity-0 ${i % 5 === 0 ? "bg-zinc-100" : "bg-zinc-500"}`} />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
          {SQUARES.map((i) => (
            <div key={i} data-i="sq" className={`col-start-1 row-start-1 size-[80vmin] opacity-0 ${i % 2 ? "border-2 border-zinc-100" : "border-[3px] border-lime-300"}`} />
          ))}
          <p data-i="fn" className="col-start-1 row-start-1 font-mono text-[8vw] font-bold text-white opacity-0">f(6)</p>
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p data-i="net-label" className="absolute top-[8%] font-mono text-[3.4vw] text-zinc-400 opacity-0 md:text-[1.6vw]">model.fit(curiosity)</p>
          <svg data-i="net" viewBox="0 0 100 56" className="w-[min(92vw,150vh)] overflow-visible opacity-0">
            {LINKS.map(({ l, a, b }, k) => (
              <line key={k} data-i="wire" data-l={l} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3f3f46" strokeWidth="0.15" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
            ))}
            {LINKS.map(({ l, a, b }, k) => (
              <line key={k} data-i="pulse" data-l={l} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c6f432" strokeWidth="0.4" strokeLinecap="round" pathLength={1} strokeDasharray="0.12 1" strokeDashoffset="0.12" />
            ))}
            {LAYERS.flat().map((nd, k) => (
              <circle key={k} data-i="neuron" data-l={nd.l} cx={nd.x} cy={nd.y} r="0" fill="#f4f4f5" />
            ))}
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-start justify-between overflow-hidden px-[1vw] opacity-40">
          {RAIN.map((col, i) => (
            <p key={i} data-i="rain" className={`w-[1ch] break-all font-mono text-[2.2vw] leading-[1.1] ${i % 4 === 0 ? "text-zinc-100" : "text-lime-300"}`}>
              {col}
            </p>
          ))}
        </div>
        <p data-i="hello" className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[8vw] font-bold text-white opacity-0"> </p>

        <div className="pointer-events-none absolute inset-0 grid place-items-center [perspective:1000px]">
          <p className="whitespace-nowrap text-[15vw] font-bold tracking-[-0.06em] [transform-style:preserve-3d]">
            {profile.name.toUpperCase().split("").map((c, i) => (
              <span key={i} data-i="ch" className={`inline-block opacity-0 ${i % 2 ? "text-lime-300" : ""}`}>{c}</span>
            ))}
          </p>
        </div>

        <p data-i="caret" className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[14vw] font-bold text-lime-300 opacity-0">_</p>

        <div data-i="panel" className="absolute inset-0 grid place-items-center bg-lime-300 text-black [clip-path:inset(100%_0_0_0)]">
          <p data-i="name" className="whitespace-nowrap text-[16.4vw] font-bold tracking-[-0.06em]">{profile.name.toUpperCase()}</p>
          <div className="absolute inset-x-4 top-5 flex justify-between font-mono text-xs uppercase tracking-widest md:inset-x-10">
            <span data-i="panel-meta">{profile.role}</span>
            <span data-i="panel-meta">Hello, World.</span>
          </div>
        </div>

        <button data-i="skip" className="absolute bottom-6 right-4 z-10 rounded-full border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-300 mix-blend-difference hover:bg-white hover:text-black md:right-10">
          Skip intro →
        </button>
      </div>
    </>
  );
}
