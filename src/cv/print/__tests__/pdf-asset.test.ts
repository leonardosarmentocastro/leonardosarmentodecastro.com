import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CV_PDF_HASH_FILE,
  CV_PDF_PUBLIC_PATH,
  computeCvPdfContentHash,
} from "../pdf-asset";

describe("cv pdf asset", () => {
  it("exposes the public asset path used by RESUME.resumePdf", () => {
    expect(CV_PDF_PUBLIC_PATH).toBe(
      "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
    );
  });

  it("computes a deterministic content hash", () => {
    expect(computeCvPdfContentHash()).toBe(computeCvPdfContentHash());
    expect(computeCvPdfContentHash()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("matches the committed hash (regenerate with `pnpm cv:pdf` if this fails)", () => {
    const committed = readFileSync(CV_PDF_HASH_FILE, "utf8").trim();
    expect(committed).toBe(computeCvPdfContentHash());
  });
});
