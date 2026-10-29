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
const CELLS = Array.from({ length: 96 }, (_, i) => i);
const FACES = ["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];
const GLYPHS = ["✦", "○", "△", "□", "✕", "◐"];
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
        const cube = q("[data-i=cube]")[0];
        const faces = q("[data-i=face]");
        const half = cube.offsetWidth / 2;
        const rand = gsap.utils.random;
        gsap.set(faces, { z: half });

        tl.addLabel("intro", intro0)
          .call(() => { sfx.drone(20); sfx.riser(1.2); }, [], "intro")
          // 0–1.6s: a lime hairline slices the screen.
          .from(q("[data-i=line]"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, "intro")
          .to(q("[data-i=line]"), { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "expo.in" }, "intro+=1.1")
          .from(q("[data-i=meta]"), { opacity: 0, duration: 0.6 }, "intro+=0.2");

        // 1.6–5.5s: Design. Code. Ship.
        q("[data-i=word] span").forEach((w, i) => {
          const at = 1.6 + i * 1.3;
          tl.call(() => sfx.hit(), [], `intro+=${at}`)
            .fromTo(w, { yPercent: 140 }, { yPercent: 0, duration: 0.6, ease: "expo.out" }, `intro+=${at}`)
            .fromTo(w, { textShadow: "0.06em 0 #c6f432, -0.06em 0 #ff2bd6", skewX: -12 }, { textShadow: "0em 0 #c6f432, 0em 0 #ff2bd6", skewX: 0, duration: 0.5, ease: "power3.out" }, `intro+=${at + 0.1}`)
            .to(w, { yPercent: -140, duration: 0.5, ease: "expo.in" }, `intro+=${at + 0.8}`);
        });

        // 5.6–8.6s: shape storm. Geometry explodes out, spins, then gets sucked back in.
        tl.call(() => sfx.hit(1), [], "intro+=5.6")
          .fromTo(shapes, { x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }, {
            x: () => rand(-50, 50) * innerWidth / 100,
            y: () => rand(-45, 45) * innerHeight / 100,
            scale: () => rand(0.6, 2.2),
            rotate: () => rand(-540, 540),
            duration: 1.3, ease: "expo.out", stagger: { amount: 0.25, from: "random" }, immediateRender: false,
          }, "intro+=5.6")
          .to(shapes, { rotate: "+=160", duration: 1.2, ease: "none" }, "intro+=6.8")
          .call(() => sfx.riser(1.1), [], "intro+=7.2")
          .to(shapes, { x: 0, y: 0, scale: 0, rotate: "+=360", duration: 0.8, ease: "expo.in", stagger: { amount: 0.15, from: "edges" } }, "intro+=7.7")
          .call(() => sfx.hit(1), [], "intro+=8.5")
          .fromTo(q("[data-i=flash]"), { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, "intro+=8.5");

        // 8.8–11.4s: grid wave. Tiles flood out from the centre, ripple, then flip away from the edges.
        const grid = { grid: [8, 12] as [number, number] };
        for (let k = 0; k < 12; k++) tl.call(() => sfx.tick(), [], `intro+=${8.8 + k * 0.06}`);
        tl.fromTo(cells, { scale: 0, rotate: 90 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)", stagger: { ...grid, from: "center", amount: 0.7 } }, "intro+=8.8")
          .call(() => sfx.hit(0.6), [], "intro+=9.9")
          .to(cells, { scale: 0.3, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: { ...grid, from: "center", amount: 0.5 } }, "intro+=9.9")
          .call(() => sfx.whoosh(), [], "intro+=10.8")
          .to(cells, { rotateX: 90, scale: 0, duration: 0.5, ease: "expo.in", stagger: { ...grid, from: "edges", amount: 0.5 } }, "intro+=10.8");

        // 11.4–14.4s: a 3D cube slams in, spins hard, then blows apart face by face.
        tl.fromTo(cube, { scale: 0, rotateX: -200, rotateY: -120, opacity: 1 }, { scale: 1, rotateX: -25, rotateY: 35, duration: 1.1, ease: "expo.out", immediateRender: false }, "intro+=11.4")
          .call(() => sfx.hit(1), [], "intro+=11.5")
          .call(() => sfx.hit(0.6), [], "intro+=12.4")
          .to(cube, { rotateY: "+=270", rotateX: "+=180", duration: 1.5, ease: "power3.inOut" }, "intro+=12.4")
          .call(() => sfx.riser(1.1), [], "intro+=12.9")
          .to(cube, { scale: 1.25, duration: 0.3, ease: "power2.out" }, "intro+=13.9")
          .call(() => sfx.hit(1), [], "intro+=14.05")
          .to(faces, { z: half * 6, opacity: 0, duration: 0.5, ease: "expo.in", stagger: 0.03 }, "intro+=14");

        // 14.4–16.4s: outlined name rows race across, accelerating.
        q("[data-i=row]").forEach((r, i) => {
          const dir = i % 2 ? 1 : -1;
          tl.fromTo(r, { xPercent: dir > 0 ? -50 : 0, opacity: 0 }, { xPercent: dir > 0 ? 0 : -50, opacity: 1, duration: 2, ease: "power2.in" }, "intro+=14.4");
        });
        tl.call(() => sfx.riser(2), [], "intro+=14.4")
          .to(q("[data-i=rows]"), { scale: 1.3, rotate: -4, duration: 2, ease: "power2.in" }, "intro+=14.4")
          .to(q("[data-i=rows]"), { opacity: 0, duration: 0.2 }, "intro+=16.3");

        // 16.4–19s: lime panel rises, name lands.
        tl.call(() => sfx.impact(), [], "intro+=16.8")
          .fromTo(q("[data-i=panel]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" }, "intro+=16.4")
          .from(q("[data-i=name]"), { scale: 1.5, opacity: 0, filter: "blur(20px)", duration: 1.4, ease: "expo.out" }, "intro+=16.8")
          .from(q("[data-i=panel-meta]"), { opacity: 0, y: 10, duration: 0.6, stagger: 0.1 }, "intro+=17.4");

        // 19–20s: the whole intro wipes up to reveal the site.
        tl.call(() => sfx.whoosh(), [], "intro+=18.9")
          .to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "intro+=19")
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

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {SHAPES.map((i) => {
            const size = `${2 + ((i * 7) % 9)}vmin`;
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

        <div className="pointer-events-none absolute inset-0 grid place-items-center [perspective:900px]">
          <div data-i="cube" className="relative size-[34vmin] opacity-0 [transform-style:preserve-3d]">
            {FACES.map((f, i) => (
              <div key={f} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: f }}>
                <div data-i="face" className={`grid size-full place-items-center border-2 border-lime-300 text-[14vmin] font-bold ${i % 2 ? "bg-lime-300 text-black" : "bg-[#050505]/85 text-lime-300"}`}>
                  {GLYPHS[i]}
                </div>
              </div>
            ))}
          </div>
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
            <span data-i="panel-meta">Portfolio ©2026</span>
          </div>
        </div>

        <button data-i="skip" className="absolute bottom-6 right-4 z-10 rounded-full border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-300 mix-blend-difference hover:bg-white hover:text-black md:right-10">
          Skip intro →
        </button>
      </div>
    </>
  );
}
