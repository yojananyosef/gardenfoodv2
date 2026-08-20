import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gardenfoodv2.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/huerto",
        "/calendario",
        "/cosechas",
        "/recomendadas",
        "/perfil",
        "/admin",
        "/login",
        "/registro",
        "/suscripcion/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
