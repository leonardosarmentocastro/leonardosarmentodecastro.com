import { describe, expect, it } from "vitest";
import { RESUME } from "@/cv/data";
import { CV_PDF_PUBLIC_PATH } from "../constants";

describe("cv pdf constants", () => {
  it("exposes the public asset path used by RESUME.resumePdf", () => {
    expect(CV_PDF_PUBLIC_PATH).toBe(
      "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
    );
    // Single source of truth: the recruiter link must point at this asset.
    expect(RESUME.hero.links.resumePdf).toBe(CV_PDF_PUBLIC_PATH);
  });
});
