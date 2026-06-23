import { describe, expect, it } from "vitest";

import { metadata } from "../page";

describe("/cv/pdf page metadata", () => {
  it("uses the canonical résumé share title", () => {
    expect(metadata.title).toBe("Leonardo Sarmento de Castro — Résumé (PDF)");
  });

  it("declares Open Graph metadata", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBe(
      "Leonardo Sarmento de Castro — Résumé (PDF)",
    );
  });

  it("uses a large-image Twitter card", () => {
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
