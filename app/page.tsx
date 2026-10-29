import Hero from "@/components/Hero";
import Motion from "@/components/Motion";
import { achievements, experience, profile, stack, stats } from "@/lib/data";
import { getProjects } from "@/lib/vercel";

const screenshot = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

function Label({ n, children }: { n: string; children: string }) {
  return (
    <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-lime-300/70">
      {n} / {children}
    </p>
  );
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <main>
      <Motion />
      <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#050505]/75 px-4 py-5 font-mono text-xs uppercase tracking-widest backdrop-blur-md md:px-10">
        <a href="#top">{profile.name}</a>
        <div className="flex gap-5 md:gap-8">
          <a href="#work" className="hover:opacity-60">Work</a>
          <a href="#about" className="hover:opacity-60">About</a>
          <a href="#wins" className="hover:opacity-60">Wins</a>
          <a href="#contact" className="hover:opacity-60">Contact</a>
        </div>
      </nav>

      <Hero />

      <section id="about" className="mx-auto max-w-6xl px-4 py-32 md:px-10 md:py-48">
        <Label n="01">About</Label>
        <div className="grid items-center gap-12 md:grid-cols-[1fr_280px]">
          <p data-scrub-words className="text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            {profile.bio}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-reveal data-scrub-color src="/me.jpg" alt={profile.name} className="tilt aspect-[4/5] w-full rounded-2xl border border-white/10 object-cover" />
        </div>
      </section>

      <section aria-label="Tech stack" className="overflow-hidden border-y border-white/10 py-8">
        <div className="marquee flex w-max gap-12 text-4xl font-semibold tracking-tight text-zinc-600 md:text-6xl">
          {[...stack, ...stack].map((s, i) => (
            <span key={i} aria-hidden={i >= stack.length} className="transition-colors hover:text-white">
              {s} <span className="text-lime-300">✦</span>
            </span>
          ))}
        </div>
        <div aria-hidden className="marquee marquee-reverse mt-4 flex w-max gap-12 text-4xl font-semibold tracking-tight text-transparent [-webkit-text-stroke:1px_#52525b] md:text-6xl">
          {[...stack, ...stack].reverse().map((s, i) => (
            <span key={i}>{s} ✦</span>
          ))}
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-4 py-32 md:px-10 md:py-48">
        <Label n="02">Selected work</Label>
        <h2 data-heading className="mb-16 text-5xl font-bold tracking-tighter md:text-8xl">Things I&apos;ve shipped</h2>
        {/* Each card sticks a little lower than the last, so they pile up as you scroll. */}
        <div>
          {projects.map((p, i) => (
            <article
              key={p.name}
              data-stack
              className="sticky mb-[10vh] flex h-[78vh] origin-top flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 last:mb-0 md:grid md:grid-cols-[1.5fr_1fr]"
              style={{ top: `calc(6rem + ${i * 1.25}rem)` }}
            >
              <a href={p.url} target="_blank" rel="noreferrer" className="group relative block min-h-0 flex-1 overflow-hidden bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image ?? screenshot(p.url)} alt={`${p.name} preview`} loading="lazy" className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105" />
              </a>
              <div className="flex flex-col justify-between gap-6 border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-10">
                <div>
                  <p className="font-mono text-xs text-zinc-500">
                    <span className="text-lime-300">{String(i + 1).padStart(2, "0")}</span> / {String(projects.length).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-4xl font-bold tracking-tighter md:mt-6 md:text-6xl">{p.name}</h3>
                  <p className="mt-3 text-zinc-400 md:mt-4 md:text-lg">{p.description ?? new URL(p.url).host}</p>
                  {!!p.tags?.length && (
                    <ul className="mt-4 flex flex-wrap gap-2 md:mt-6">
                      {p.tags.map((t) => (
                        <li key={t} className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-zinc-300">{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-3">
                  <a href={p.url} target="_blank" rel="noreferrer" className="rounded-full bg-lime-300 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black transition-transform hover:scale-105">
                    Live site ↗
                  </a>
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-zinc-300 hover:border-white hover:text-white">
                      Code
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="wins" className="mx-auto max-w-6xl px-4 pb-32 md:px-10 md:pb-48">
        <Label n="03">Achievements</Label>
        <h2 data-heading className="mb-16 text-5xl font-bold tracking-tighter md:text-8xl">Proof of work.</h2>
        <div className="grid gap-6 md:grid-cols-6">
          {achievements.map((a, i) => (
            <article
              key={a.title}
              data-reveal
              className={`group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-lime-300/50 ${
                ["md:col-span-4", "md:col-span-2", "md:col-span-3", "md:col-span-3"][i]
              }`}
            >
              <div className={`relative overflow-hidden ${i < 2 ? "aspect-[4/5] md:aspect-auto md:h-[26rem]" : "aspect-[16/10]"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt={a.title} loading="lazy" className="absolute inset-0 size-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-105" />
                {a.hoverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.hoverImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                )}
                <p className="absolute left-5 top-5 rounded-full bg-lime-300 px-4 py-1.5 font-mono text-sm font-bold text-black">
                  {a.rank} <span className="font-normal opacity-70">{a.of}</span>
                </p>
              </div>
              <div className="flex-1 border-t border-white/10 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">{a.org}</p>
                <h3 className={`mt-2 font-semibold tracking-tight transition-colors group-hover:text-lime-300 ${i === 0 ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}>{a.title}</h3>
                <p className="mt-2 max-w-md text-zinc-400">{a.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-32 md:px-10 md:pb-48">
        <Label n="04">Journey</Label>
        <div className="relative pl-8 md:pl-12">
          <div data-line className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-lime-300 via-lime-300/40 to-transparent" />
          {experience.map((e) => (
            <div key={e.when + e.role} data-reveal className="mb-16 last:mb-0">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">{e.when}</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {e.role} <span className="text-zinc-500">@ {e.org}</span>
              </h3>
              <p className="mt-3 max-w-xl text-zinc-400">{e.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-6xl gap-px md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-14 text-center md:px-10">
              <p className="text-7xl font-bold tracking-tighter md:text-8xl">
                <span data-count={s.value}>{s.value}</span>
                <span className="text-lime-300">{s.suffix}</span>
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="relative overflow-hidden px-4 py-40 text-center md:px-10 md:py-56">
        <div className="glow absolute inset-0 -z-10" />
        <Label n="05">Contact</Label>
        <h2 data-heading className="text-6xl font-bold leading-[0.9] tracking-tighter md:text-[9vw]">
          Let&apos;s build<br />something.
        </h2>
        <a href={`mailto:${profile.email}`} className="mt-12 inline-block rounded-full bg-white px-8 py-4 font-medium text-black transition-transform hover:scale-105">
          {profile.email}
        </a>
        <p className="mt-4">
          <a href={`mailto:${profile.altEmail}`} className="font-mono text-xs text-zinc-500 hover:text-white">{profile.altEmail}</a>
        </p>
        <div className="mt-10 flex justify-center gap-8 font-mono text-xs uppercase tracking-widest text-zinc-400">
          {profile.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white">{s.label}</a>
          ))}
          <a href={profile.resume} className="hover:text-white">Resume</a>
        </div>
      </section>

      <footer className="overflow-hidden px-4 pt-8 md:px-10">
        <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-zinc-600">
          <span>© {profile.name}</span>
          <a href="#top" className="hover:text-white">Back to top ↑</a>
        </div>
        <p aria-hidden className="mt-6 whitespace-nowrap text-[16.4vw] font-bold leading-[0.75] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_#3f3f46]">
          {profile.name.toUpperCase()}
        </p>
      </footer>
    </main>
  );
}
