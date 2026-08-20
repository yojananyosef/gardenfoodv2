import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { route: string; priority: number }[] = [
    { route: "", priority: 1 },
    { route: "/explorar", priority: 0.7 },
    { route: "/calculadoras", priority: 0.7 },
    { route: "/pricing", priority: 0.7 },
  ];
  const especiesRoutes = (() => {
    try {
      // Import at runtime to avoid bundling 30 fichas via dynamic - especies is light
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ESPECIES } = require("@/lib/agronomy/especies") as { ESPECIES: { slug: string }[] };
      return ESPECIES.map((e) => ({ route: `/especies/${e.slug}`, priority: 0.8 }));
    } catch {
      return [];
    }
  })();
  const all = [...routes, ...especiesRoutes];
  return all.map(({ route, priority }) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}
