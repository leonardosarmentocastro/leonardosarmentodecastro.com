import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const hostnames = [
    "https://leonardosarmentocastro.com",
    "https://leonardosarmentodecastro.com",
  ];

  return hostnames.flatMap((host) => [
    {
      url: `${host}/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    {
      url: `${host}/cv`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
  ]);
}
