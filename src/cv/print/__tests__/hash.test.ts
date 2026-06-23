import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CV_PDF_HASH_FILE } from "../constants";
import { computeCvPdfContentHash } from "../hash";

describe("cv pdf content hash", () => {
  it("computes a deterministic content hash", () => {
    expect(computeCvPdfContentHash()).toBe(computeCvPdfContentHash());
    expect(computeCvPdfContentHash()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("matches the committed hash (regenerate with `pnpm cv:pdf` if this fails)", () => {
    const committed = readFileSync(CV_PDF_HASH_FILE, "utf8").trim();
    expect(committed).toBe(computeCvPdfContentHash());
  });
});
