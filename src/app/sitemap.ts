import type { MetadataRoute } from "next";

import { CANONICAL_ORIGIN } from "@/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${CANONICAL_ORIGIN}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${CANONICAL_ORIGIN}/cv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
