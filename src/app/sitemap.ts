import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "/",
  "/calculators/compound-interest",
  "/calculators/simple-interest",
  "/calculators/investment-return",
  "/calculators/loan",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
