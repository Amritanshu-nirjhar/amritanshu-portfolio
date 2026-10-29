"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { profile } from "@/lib/data";
import { sfx, startSound, stopSound } from "@/lib/sound";

gsap.registerPlugin(ScrollTrigger, SplitText);

const WORDS = ["Design.", "Code.", "Ship."];
const SHAPES = Array.from({ length: 48 }, (_, i) => i);
const CODE = ["{ }", "</>", "=>", "01", ";", "&&", "λ", "#", "[ ]", "!="];
const CELLS = Array.from({ length: 96 }, (_, i) => i);
const FACES = ["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];
const GLYPHS = ["{}", "</>", "01", "λ", "&&", "#"];
const RINGS = Array.from({ length: 6 }, (_, i) => i);
const BARS = Array.from({ length: 28 }, (_, i) => i);
const STRIPS = Array.from({ length: 6 }, (_, i) => i);
const TERM = [
  ["$", "git commit -m \"ship it\""],
  ["$", "npm run build"],
  ["▲", "compiling 1,284 modules…"],
  ["✓", "compiled in 0.42s"],
  ["$", "deploy --prod"],
  ["✓", "live in production"],
];
// Binary rain: deterministic so server and client render the same digits.
const RAIN = Array.from({ length: 26 }, (_, i) => Array.from({ length: 40 }, (_, j) => ((i * 31 + j * 17) % 7 > 3 ? "1" : "0")).join(""));
// Binary tree, 4 levels: node k on level l sits at x = (k + 0.5) / 2^l.
const TREE = Array.from({ length: 15 }, (_, n) => {
  const l = Math.floor(Math.log2(n + 1));
  const k = n + 1 - 2 ** l;
  return { n, l, x: ((k + 0.5) / 2 ** l) * 100, y: 8 + l * 15 };
});
const BIG_O = ["O(n²)", "O(n log n)", "O(log n)", "O(1)"];
const ROW = `${profile.name.toUpperCase()} — DEVELOPER — `.repeat(4);

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
        const shapes = q("[data-i=shape]");
        const cells = q("[data-i=cell]");
        const rings = q("[data-i=ring]");
        const spin = q("[data-i=spin]");
        const bars = q("[data-i=bar]");
        const strips = q("[data-i=strip]");
        const symbol = q("[data-i=symbol]");
        const chars = q("[data-i=ch]");
        const flash = q("[data-i=flash]");
        const term = q("[data-i=term]");
        const termChars = SplitText.create(q("[data-i=tline]"), { type: "chars" }).chars;
        const rain = q("[data-i=rain]");
        const tree = q("[data-i=tree]");
        const bigO = q("[data-i=bigo]")[0];
        const cube = q("[data-i=cube]")[0];
        const faces = q("[data-i=face]");
        const half = cube.offsetWidth / 2;
        const rand = gsap.utils.random;
        const at = (t: number) => `intro+=${t}`;
        const ticks = (from: number, n: number, gap: number) => {
          for (let k = 0; k < n; k++) tl.call(() => sfx.tick(), [], at(from + k * gap));
        };
        const glitch = { textShadow: "0.06em 0 #c6f432, -0.06em 0 #ff2bd6", skewX: -12 };
        const unglitch = { textShadow: "0em 0 #c6f432, 0em 0 #ff2bd6", skewX: 0, duration: 0.25, ease: "power3.out" };
        gsap.set(faces, { z: half });

        tl.addLabel("intro", intro0)
          .call(() => { sfx.drone(20); sfx.riser(0.5); }, [], at(0))
          // 0–0.6s: a lime hairline slices the screen.
          .from(q("[data-i=line]"), { scaleX: 0, duration: 0.4, ease: "expo.inOut" }, at(0))
          .to(q("[data-i=line]"), { scaleX: 0, transformOrigin: "right", duration: 0.2, ease: "expo.in" }, at(0.4))
          .from(q("[data-i=meta]"), { opacity: 0, duration: 0.3 }, at(0.1));

        // 0.6–2.1s: Design. Code. Ship. Slammed 0.5s apart.
        q("[data-i=word] span").forEach((w, i) => {
          const t = 0.6 + i * 0.5;
          tl.call(() => sfx.hit(), [], at(t))
            .fromTo(w, { yPercent: 140 }, { yPercent: 0, duration: 0.25, ease: "expo.out" }, at(t))
            .fromTo(w, glitch, unglitch, at(t + 0.03))
            .to(w, { yPercent: -140, duration: 0.18, ease: "expo.in" }, at(t + 0.32));
        });

        // 2.2–3.6s: terminal. Commit, build, deploy, typed at machine speed.
        ticks(2.2, 12, 0.1);
        tl.set(term, { opacity: 1 }, at(2.2))
          .fromTo(termChars, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.009, immediateRender: false }, at(2.2))
          .to(term, { yPercent: -15, opacity: 0, duration: 0.2, ease: "expo.in" }, at(3.4));

        // 3.6–4.8s: shape + code-glyph storm explodes, spins, implodes, flash.
        tl.call(() => sfx.hit(1), [], at(3.6))
          .fromTo(shapes, { x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }, {
            x: () => rand(-50, 50) * innerWidth / 100,
            y: () => rand(-45, 45) * innerHeight / 100,
            scale: () => rand(0.6, 2.2),
            rotate: () => rand(-540, 540),
            duration: 0.5, ease: "expo.out", stagger: { amount: 0.1, from: "random" }, immediateRender: false,
          }, at(3.6))
          .to(shapes, { rotate: "+=90", duration: 0.35, ease: "none" }, at(4))
          .to(shapes, { x: 0, y: 0, scale: 0, rotate: "+=360", duration: 0.3, ease: "expo.in", stagger: { amount: 0.06, from: "edges" } }, at(4.35))
          .call(() => sfx.hit(1), [], at(4.7))
          .fromTo(flash, { opacity: 0.9 }, { opacity: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, at(4.7));

        // 4.8–6s: binary rain pours down the screen.
        ticks(4.8, 10, 0.1);
        tl.fromTo(rain, { yPercent: -110 }, { yPercent: 110, duration: 0.75, ease: "power1.in", stagger: { amount: 0.35, from: "random" } }, at(4.8));

        // 6–7.2s: grid wave. Tiles flood from the centre, ripple, flip away.
        const grid = { grid: [8, 12] as [number, number] };
        ticks(6, 8, 0.035);
        tl.fromTo(cells, { scale: 0, rotate: 90 }, { scale: 1, rotate: 0, duration: 0.3, ease: "back.out(2)", stagger: { ...grid, from: "center", amount: 0.3 } }, at(6))
          .call(() => sfx.hit(0.6), [], at(6.5))
          .to(cells, { scale: 0.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: { ...grid, from: "center", amount: 0.2 } }, at(6.5))
          .call(() => sfx.whoosh(), [], at(6.8))
          .to(cells, { rotateX: 90, scale: 0, duration: 0.22, ease: "expo.in", stagger: { ...grid, from: "edges", amount: 0.2 } }, at(6.85));

        // 7.2–8.4s: binary tree builds level by level, then a DFS traversal lights it up.
        for (let l = 0; l < 4; l++) {
          const t = 7.2 + l * 0.12;
          tl.call(() => sfx.tick(), [], at(t))
            .fromTo(q(`[data-i=edge][data-l="${l}"]`), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.15, ease: "power2.out" }, at(t))
            .fromTo(q(`[data-i=node][data-l="${l}"]`), { scale: 0, transformOrigin: "center" }, { scale: 1, duration: 0.2, ease: "back.out(3)" }, at(t + 0.05));
        }
        const dfs = (n: number): number[] => (n > 14 ? [] : [n, ...dfs(2 * n + 1), ...dfs(2 * n + 2)]);
        dfs(0).forEach((n, i) => {
          tl.call(() => sfx.tick(), [], at(7.75 + i * 0.025))
            .to(q(`[data-i=node][data-n="${n}"]`), { fill: "#c6f432", duration: 0.05 }, at(7.75 + i * 0.025));
        });
        tl.to(tree, { scale: 1.4, opacity: 0, duration: 0.2, ease: "expo.in" }, at(8.2));

        // 8.4–9.6s: sorting visualiser. Shuffle, shuffle, sort, verified sweep.
        const sorted = BARS.map((i) => (i + 1) / BARS.length);
        tl.fromTo(bars, { scaleY: 0, opacity: 1 }, { scaleY: () => rand(0.1, 1), duration: 0.18, ease: "power2.out", stagger: { each: 0.006, from: "center" }, immediateRender: false }, at(8.4))
          .call(() => sfx.tick(), [], at(8.62))
          .to(bars, { scaleY: () => rand(0.1, 1), duration: 0.14, ease: "power2.inOut", stagger: { each: 0.004, from: "random" } }, at(8.62))
          .call(() => sfx.hit(0.6), [], at(8.85))
          .to(bars, { scaleY: (i) => sorted[i], duration: 0.3, ease: "expo.out", stagger: { each: 0.01 } }, at(8.85));
        ticks(9.15, 6, 0.03);
        tl.to(bars, { backgroundColor: "#c6f432", duration: 0.05, stagger: 0.006 }, at(9.15))
          .to(bars, { scaleY: 0, duration: 0.18, ease: "expo.in", stagger: { each: 0.005, from: "end" } }, at(9.4));

        // 9.6–10.6s: 3D cube of code glyphs slams in, spins, blows apart.
        tl.fromTo(cube, { scale: 0, rotateX: -200, rotateY: -120, opacity: 1 }, { scale: 1, rotateX: -25, rotateY: 35, duration: 0.35, ease: "expo.out", immediateRender: false }, at(9.6))
          .call(() => sfx.hit(1), [], at(9.62))
          .call(() => sfx.hit(0.6), [], at(9.95))
          .to(cube, { rotateY: "+=270", rotateX: "+=180", duration: 0.4, ease: "power3.inOut" }, at(9.95))
          .call(() => sfx.hit(1), [], at(10.37))
          .to(faces, { z: half * 6, opacity: 0, duration: 0.25, ease: "expo.in", stagger: 0.015 }, at(10.35));

        // 10.6–11.6s: Big-O countdown, each one glitched in.
        tl.set(bigO, { opacity: 1 }, at(10.6));
        BIG_O.forEach((o, i) => {
          const t = 10.6 + i * 0.22;
          tl.call(() => { bigO.textContent = o; sfx.hit(i === BIG_O.length - 1 ? 1 : 0.4); }, [], at(t))
            .fromTo(bigO, { ...glitch, scale: 1.15 }, { ...unglitch, scale: 1, duration: 0.18 }, at(t));
        });
        tl.to(bigO, { opacity: 0, scale: 0.6, duration: 0.15, ease: "expo.in" }, at(11.48));

        // 11.6–12.8s: strips slam in from alternating sides, a giant </> blends over them.
        tl.call(() => sfx.whoosh(), [], at(11.6))
          .fromTo(strips, { xPercent: (i) => (i % 2 ? 101 : -101) }, { xPercent: 0, duration: 0.3, ease: "expo.out", stagger: 0.035 }, at(11.6))
          .call(() => sfx.hit(1), [], at(11.85))
          .fromTo(symbol, { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, at(11.85))
          .to(strips, { xPercent: (i) => (i % 2 ? -101 : 101), duration: 0.3, ease: "expo.in", stagger: 0.03 }, at(12.4))
          .to(symbol, { opacity: 0, scale: 0.6, duration: 0.2, ease: "expo.in" }, at(12.45));

        // 12.8–14.2s: the name's letters fly in from 3D space, lock, shatter.
        tl.fromTo(chars, {
            x: () => rand(-600, 600), y: () => rand(-400, 400), z: () => rand(-1500, 600),
            rotateX: () => rand(-180, 180), rotateY: () => rand(-180, 180), opacity: 0,
          }, {
            x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, opacity: 1,
            duration: 0.5, ease: "expo.out", stagger: { amount: 0.15, from: "random" }, immediateRender: false,
          }, at(12.8))
          .call(() => sfx.hit(1), [], at(13.15))
          .call(() => sfx.whoosh(), [], at(13.75))
          .to(chars, {
            x: () => rand(-900, 900), y: () => rand(-600, 600), z: () => rand(200, 1200), rotate: () => rand(-180, 180), opacity: 0,
            duration: 0.4, ease: "expo.in", stagger: { amount: 0.08, from: "center" },
          }, at(13.75));

        // 14.2–15s: radar rings pulse out around a spinning dashed ring.
        tl.call(() => sfx.hit(0.7), [], at(14.2))
          .fromTo(rings, { scale: 0, opacity: 1 }, { scale: (i) => 3 + i * 1.6, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.05, immediateRender: false }, at(14.2))
          .fromTo(spin, { scale: 0, rotate: -180, opacity: 1 }, { scale: 1, rotate: 180, duration: 0.6, ease: "expo.out", immediateRender: false }, at(14.2))
          .to(spin, { scale: 0, rotate: "+=180", duration: 0.2, ease: "expo.in" }, at(14.8));

        // 15–16.4s: outlined name rows race across, accelerating.
        q("[data-i=row]").forEach((r, i) => {
          const dir = i % 2 ? 1 : -1;
          tl.fromTo(r, { xPercent: dir > 0 ? -50 : 0, opacity: 0 }, { xPercent: dir > 0 ? 0 : -50, opacity: 1, duration: 1.4, ease: "power2.in" }, at(15));
        });
        tl.call(() => sfx.riser(1.4), [], at(15))
          .to(q("[data-i=rows]"), { scale: 1.3, rotate: -4, duration: 1.4, ease: "power2.in" }, at(15))
          .to(q("[data-i=rows]"), { opacity: 0, duration: 0.1 }, at(16.35));

        // 16.4–19s: lime panel rises, name lands.
        tl.call(() => sfx.impact(), [], at(16.7))
          .fromTo(q("[data-i=panel]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "expo.inOut" }, at(16.4))
          .from(q("[data-i=name]"), { scale: 1.5, opacity: 0, filter: "blur(20px)", duration: 1, ease: "expo.out" }, at(16.7))
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
        <div data-i="line" className="absolute left-0 top-1/2 h-px w-full origin-left bg-lime-300" />
        <div data-i="meta" className="absolute inset-x-4 top-5 flex justify-between font-mono text-xs uppercase tracking-widest text-zinc-500 md:inset-x-10">
          <span>{profile.name} — Portfolio</span>
          <span data-i="time">00:00 / 00:20</span>
        </div>

        <div className="absolute inset-0 grid place-items-center px-4 text-center">
          {WORDS.map((w) => (
            <p key={w} data-i="word" className="col-start-1 row-start-1 overflow-hidden text-[18vw] font-bold leading-[0.9] tracking-[-0.06em]">
              <span className="block">{w}</span>
            </p>
          ))}
        </div>

        <div data-i="term" className="pointer-events-none absolute inset-0 grid place-items-center opacity-0">
          <div className="font-mono text-[3.4vw] leading-snug md:text-[2.2vw]">
            {TERM.map(([sym, cmd], i) => (
              <p key={i} data-i="tline">
                <span className={sym === "✓" ? "text-lime-300" : "text-zinc-500"}>{sym}</span> <span className={sym === "✓" ? "text-lime-300" : "text-zinc-100"}>{cmd}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {SHAPES.map((i) => {
            const size = `${2 + ((i * 7) % 9)}vmin`;
            if (i % 6 >= 4) {
              return (
                <span key={i} data-i="shape" className={`col-start-1 row-start-1 font-mono font-bold opacity-0 ${i % 2 ? "text-lime-300" : "text-zinc-100"}`} style={{ fontSize: size }}>
                  {CODE[i % CODE.length]}
                </span>
              );
            }
            const kind = [
              "rounded-full border-2 border-lime-300",
              "bg-zinc-100",
              "!h-[2px] bg-lime-300",
              "bg-zinc-100 [clip-path:polygon(50%_0,100%_100%,0_100%)]",
            ][i % 4];
            return <div key={i} data-i="shape" className={`col-start-1 row-start-1 opacity-0 ${kind}`} style={{ width: i % 4 === 2 ? `calc(${size} * 2)` : size, height: size }} />;
          })}
        </div>
        <div data-i="flash" className="pointer-events-none absolute inset-0 bg-zinc-100 opacity-0" />

        <div className="pointer-events-none absolute inset-0 flex items-start justify-between overflow-hidden px-[1vw]">
          {RAIN.map((col, i) => (
            <p key={i} data-i="rain" className={`w-[1ch] break-all font-mono text-[2.2vw] leading-[1.1] ${i % 4 === 0 ? "text-zinc-100" : "text-lime-300"}`}>
              {col}
            </p>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-8 gap-[3px] p-[3px] [perspective:800px]">
          {CELLS.map((i) => (
            <div
              key={i}
              data-i="cell"
              className={(i * 7) % 11 === 0 ? "bg-zinc-100" : (i * 3) % 7 === 0 ? "border border-lime-300" : "bg-lime-300"}
              style={{ transform: "scale(0)" }}
            />
          ))}
        </div>

        <svg data-i="tree" viewBox="0 0 100 60" className="pointer-events-none absolute inset-x-[8vw] top-1/2 w-[84vw] -translate-y-1/2 overflow-visible">
          {TREE.filter((t) => t.n > 0).map((t) => {
            const parent = TREE[Math.floor((t.n - 1) / 2)];
            return <line key={t.n} data-i="edge" data-l={t.l} x1={parent.x} y1={parent.y} x2={t.x} y2={t.y} stroke="#52525b" strokeWidth="0.25" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />;
          })}
          {TREE.map((t) => (
            <circle key={t.n} data-i="node" data-l={t.l} data-n={t.n} cx={t.x} cy={t.y} r="1.6" fill="#f4f4f5" transform="scale(0)" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-[0.8vw] pb-[20vh]">
          {BARS.map((i) => (
            <div key={i} data-i="bar" className={`h-[60vh] w-[2vw] origin-bottom opacity-0 ${i % 5 === 0 ? "bg-zinc-100" : "bg-zinc-500"}`} />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center [perspective:900px]">
          <div data-i="cube" className="relative size-[34vmin] opacity-0 [transform-style:preserve-3d]">
            {FACES.map((f, i) => (
              <div key={f} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: f }}>
                <div data-i="face" className={`grid size-full place-items-center border-2 border-lime-300 font-mono text-[10vmin] font-bold ${i % 2 ? "bg-lime-300 text-black" : "bg-[#050505]/85 text-lime-300"}`}>
                  {GLYPHS[i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p data-i="bigo" className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[13vw] font-bold tracking-tight text-lime-300 opacity-0">
          {BIG_O[0]}
        </p>

        <div className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden">
          {STRIPS.map((i) => (
            <div key={i} data-i="strip" className={`flex-1 ${i % 2 ? "bg-zinc-100" : "bg-lime-300"}`} />
          ))}
        </div>
        <p data-i="symbol" className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[30vw] font-bold tracking-[-0.06em] text-white opacity-0 mix-blend-difference">
          &lt;/&gt;
        </p>

        <div className="pointer-events-none absolute inset-0 grid place-items-center [perspective:1000px]">
          <p className="whitespace-nowrap text-[15vw] font-bold tracking-[-0.06em] [transform-style:preserve-3d]">
            {profile.name.toUpperCase().split("").map((c, i) => (
              <span key={i} data-i="ch" className={`inline-block opacity-0 ${i % 2 ? "text-lime-300" : ""}`}>{c}</span>
            ))}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {RINGS.map((i) => (
            <div key={i} data-i="ring" className="col-start-1 row-start-1 size-[12vmin] rounded-full border border-lime-300 opacity-0" />
          ))}
          <div data-i="spin" className="col-start-1 row-start-1 size-[50vmin] rounded-full border-2 border-dashed border-zinc-100 opacity-0" />
        </div>

        <div data-i="rows" className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <p key={i} data-i="row" className={`whitespace-nowrap text-[12vw] font-bold leading-none tracking-[-0.04em] opacity-0 ${i === 1 ? "text-lime-300" : "text-transparent [-webkit-text-stroke:1px_#f4f4f5]"}`}>
              {ROW}
            </p>
          ))}
        </div>

        <div data-i="panel" className="absolute inset-0 grid place-items-center bg-lime-300 text-black [clip-path:inset(100%_0_0_0)]">
          <p data-i="name" className="whitespace-nowrap text-[16.4vw] font-bold tracking-[-0.06em]">{profile.name.toUpperCase()}</p>
          <div className="absolute inset-x-4 top-5 flex justify-between font-mono text-xs uppercase tracking-widest md:inset-x-10">
            <span data-i="panel-meta">{profile.role}</span>
            <span data-i="panel-meta">Computer Science &amp; Engineering</span>
          </div>
        </div>

        <button data-i="skip" className="absolute bottom-6 right-4 z-10 rounded-full border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-300 mix-blend-difference hover:bg-white hover:text-black md:right-10">
          Skip intro →
        </button>
      </div>
    </>
  );
}
