import { describe, expect, it } from "vitest";
import { RESUME } from "@/cv/data";
import { CV_PDF_PUBLIC_PATH } from "../constants";

describe("cv pdf constants", () => {
  it("exposes the committed static asset path, intentionally distinct from the /cv/pdf share page", () => {
    // CV_PDF_PUBLIC_PATH is the public URL of the committed static PDF asset
    // at public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf.
    // The /cv/pdf route is an HTML share page that serves this asset — they
    // are intentionally different values.
    expect(CV_PDF_PUBLIC_PATH).toBe(
      "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
    );
    // The recruiter link now points at the HTML share page, not the raw asset.
    expect(RESUME.hero.links.resumePdf).toBe("/cv/pdf");
    expect(RESUME.hero.links.resumePdf).not.toBe(CV_PDF_PUBLIC_PATH);
  });
});
