import type { MetadataRoute } from "next";
import { routes, siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.filter((route) => !["/privacy", "/terms"].includes(route)).map((route) => ({ url: `${siteUrl}${route === "/" ? "" : route}` }));
}
