import { cacheLife } from "next/cache";
import { projects as manual, type Project } from "./data";

type VercelProject = {
  name: string;
  framework: string | null;
  link?: { type: string; org?: string; repo?: string };
  targets?: { production?: { alias?: string[] } };
};

// Pulls every project from your Vercel account (needs VERCEL_TOKEN), refreshed daily.
export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("days");

  const token = process.env.VERCEL_TOKEN;
  if (!token) return manual;

  const team = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`https://api.vercel.com/v9/projects?limit=100${team}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return manual;

  const { projects } = (await res.json()) as { projects: VercelProject[] };
  return projects
    .map((p): Project => ({
      name: p.name,
      url: `https://${p.targets?.production?.alias?.[0] ?? `${p.name}.vercel.app`}`,
      repo: p.link?.type === "github" ? `https://github.com/${p.link.org}/${p.link.repo}` : undefined,
      tags: p.framework ? [p.framework] : [],
      ...manual.find((m) => m.name === p.name),
    }))
    .filter((p) => !p.hide);
}
