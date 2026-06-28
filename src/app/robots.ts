import type { MetadataRoute } from "next";

import { CANONICAL_ORIGIN } from "@/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
