// src/app/cv/__tests__/page.test.ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { metadata } from "../page";

describe("/cv page metadata", () => {
  it("declares Open Graph pointing at /cv with the hero blurb", () => {
    expect(metadata.openGraph?.url).toBe("/cv");
    expect(metadata.openGraph?.description).toBe(RESUME.hero.blurb);
    expect(metadata.openGraph?.title).toBeTruthy();
  });

  it("uses a large-image Twitter card", () => {
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });
});
