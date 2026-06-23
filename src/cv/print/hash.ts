/**
 * Freshness guard for the generated recruiter PDF. The hash is computed over
 * the print layout version + the entire CV data object and committed next to
 * the PDF; a test fails when the committed hash drifts from this value, i.e.
 * the CV changed but the PDF was not regenerated (`pnpm cv:pdf`).
 */
import { createHash } from "node:crypto";

import { RESUME } from "@/cv/data";

import { PRINT_LAYOUT_VERSION } from "./constants";

export const computeCvPdfContentHash = (): string =>
  createHash("sha256")
    .update(`v${PRINT_LAYOUT_VERSION}\n`)
    .update(JSON.stringify(RESUME))
    .digest("hex");
