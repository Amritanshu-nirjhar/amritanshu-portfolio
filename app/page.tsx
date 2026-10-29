import Hero from "@/components/Hero";
import Motion from "@/components/Motion";
import { experience, profile, stack, stats } from "@/lib/data";
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
      <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-5 font-mono text-xs uppercase tracking-widest mix-blend-difference md:px-10">
        <a href="#top">{profile.name}</a>
        <div className="flex gap-5 md:gap-8">
          <a href="#work" className="hover:opacity-60">Work</a>
          <a href="#about" className="hover:opacity-60">About</a>
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
          {/* TODO: swap for <img src="/me.jpg"> */}
          <div data-reveal className="tilt grid aspect-[4/5] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-lime-300/20 via-zinc-900 to-zinc-950 text-8xl font-bold">
            {profile.name[0]}
          </div>
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
        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((p, i) => (
            <article key={p.name} data-reveal className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-lime-300/50">
              <a href={p.url} target="_blank" rel="noreferrer" className="block aspect-[16/10] overflow-hidden bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image ?? screenshot(p.url)} alt={`${p.name} preview`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105" />
              </a>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-semibold tracking-tight transition-colors group-hover:text-lime-300">
                    <span className="mr-3 font-mono text-xs text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
                    {p.name}
                  </h3>
                  <div className="flex shrink-0 gap-4 font-mono text-xs uppercase tracking-widest text-zinc-400">
                    {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" className="hover:text-white">Code</a>}
                    <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-white">Live ↗</a>
                  </div>
                </div>
                <p className="mt-2 text-zinc-400">{p.description ?? new URL(p.url).host}</p>
                {!!p.tags?.length && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-zinc-300">{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-32 md:px-10 md:pb-48">
        <Label n="03">Journey</Label>
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
        <Label n="04">Contact</Label>
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
