// src/og/__tests__/constants.test.ts
import { describe, expect, it } from "vitest";

import { OG_CONTENT_TYPE, OG_SIZE } from "../constants";

describe("og constants", () => {
  it("uses the standard 1200x630 OG size", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(OG_CONTENT_TYPE).toBe("image/png");
  });
});
