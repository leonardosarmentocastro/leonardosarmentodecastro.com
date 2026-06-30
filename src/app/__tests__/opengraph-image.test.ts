// src/app/__tests__/opengraph-image.test.ts
import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "../opengraph-image";

describe("root opengraph-image metadata", () => {
  it("declares the standard 1200x630 OG dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(contentType).toBe("image/png");
  });

  it("has descriptive alt text naming Leonardo and the role", () => {
    expect(alt).toMatch(/leonardo/i);
    expect(alt).toMatch(/engineer/i);
  });
});
