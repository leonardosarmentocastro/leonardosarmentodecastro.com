import { describe, expect, it } from "vitest";

import robots from "../robots";

describe("robots", () => {
  it("points the sitemap at the canonical host", () => {
    expect(robots().sitemap).toBe(
      "https://leonardosarmentocastro.com/sitemap.xml",
    );
  });
});
