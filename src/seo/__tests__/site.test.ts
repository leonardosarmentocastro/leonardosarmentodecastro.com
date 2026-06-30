import { describe, expect, it } from "vitest";

import { CANONICAL_ORIGIN } from "../site";

describe("CANONICAL_ORIGIN", () => {
  it("is the apex leonardosarmentocastro.com over https, with no trailing slash", () => {
    expect(CANONICAL_ORIGIN).toBe("https://leonardosarmentocastro.com");
  });
});
