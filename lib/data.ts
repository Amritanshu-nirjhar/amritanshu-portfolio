// All site content lives here. Replace the TODO placeholders with your real info.

export const profile = {
  name: "Amritanshu",
  role: "CSE Student & Developer",
  tagline: "I build fast, good-looking things for the web.",
  bio: "I'm a developer who loves turning ideas into products people actually use. I work across the stack, from pixel-perfect interfaces to the APIs behind them, and I care about speed, detail and shipping.", // TODO
  email: "amritanshu.nirjhar@gmail.com",
  altEmail: "amritanshu.n26025@nst.rishihood.edu.in",
  resume: "/resume.pdf", // TODO: drop your resume in /public
  socials: [
    { label: "GitHub", href: "https://github.com/" }, // TODO
    { label: "LinkedIn", href: "https://linkedin.com/in/" }, // TODO
    { label: "X", href: "https://x.com/" }, // TODO
  ],
};

export const stack = [
  "TypeScript", "React", "Next.js", "Node.js", "Tailwind", "Three.js",
  "PostgreSQL", "MongoDB", "Python", "Docker", "Git", "Vercel",
];

export type Project = {
  name: string;
  description?: string;
  url: string;
  repo?: string;
  tags?: string[];
  image?: string; // optional screenshot; defaults to a live screenshot of `url`
  hide?: boolean; // hide a project pulled from Vercel
};

// Without VERCEL_TOKEN this list is shown as-is.
// With VERCEL_TOKEN every Vercel project is shown, and an entry here with the
// same `name` as a Vercel project overrides its fields (description, tags, hide...).
export const projects: Project[] = [
  { name: "Odyssey", description: "A scroll-driven 3D journey from Earth to the event horizon of Sagittarius A*.", url: "https://odyssey-sable-nine.vercel.app", image: "/projects/odyssey.jpg", tags: ["Three.js", "GSAP", "WebGL"] },
  { name: "Lila Worlds", description: "Studio site for a Bengaluru team building playable worlds for Fortnite, Roblox and Meta Quest.", url: "https://lila-worlds.vercel.app", image: "/projects/lila-worlds.jpg", tags: ["Three.js", "GSAP"] },
  { name: "The Product Guys", description: "Five minutes of product management a day: short lessons, product teardowns and a library worth keeping.", url: "https://productguys.arthakram.in", image: "/projects/product-guys.jpg", tags: ["Next.js", "Three.js", "GSAP"] },
  { name: "Zero", description: "Learn. Build. Get hired.", url: "https://zero-pink-sigma.vercel.app", image: "/projects/zero.jpg", tags: ["Next.js"] },
];

export const experience = [
  { when: "2025 — Now", role: "TODO Role", org: "TODO Company", text: "What you built and the impact it had." },
  { when: "2024", role: "TODO Hackathon", org: "TODO Event", text: "What you built and what you won." },
  { when: "2023", role: "Started coding", org: "Self-taught", text: "Where it all began." },
];

export const stats = [
  { value: 20, suffix: "+", label: "Projects shipped" },
  { value: 500, suffix: "+", label: "GitHub contributions" },
  { value: 3, suffix: "", label: "Years coding" },
];
