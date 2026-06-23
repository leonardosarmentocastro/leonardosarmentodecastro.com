import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "../opengraph-image";

describe("/cv/pdf opengraph-image metadata", () => {
  it("declares the standard 1200x630 OG dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(contentType).toBe("image/png");
  });

  it("has descriptive, resume-flavored alt text", () => {
    expect(alt).toMatch(/résumé/i);
    expect(alt).toMatch(/leonardo/i);
  });
});
