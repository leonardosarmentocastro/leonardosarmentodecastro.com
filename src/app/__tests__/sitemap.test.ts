import { describe, expect, it } from "vitest";

import sitemap from "../sitemap";

describe("sitemap", () => {
  it("emits only canonical-host URLs (no leonardosarmentodecastro.com)", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const url of urls) {
      expect(url.startsWith("https://leonardosarmentocastro.com")).toBe(true);
    }
    expect(
      urls.some((url) => url.includes("leonardosarmentodecastro.com")),
    ).toBe(false);
  });

  it("includes the home and CV routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://leonardosarmentocastro.com/");
    expect(urls).toContain("https://leonardosarmentocastro.com/cv");
  });
});
