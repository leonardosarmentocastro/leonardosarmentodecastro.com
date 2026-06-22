import { createHash } from "node:crypto";
import { join } from "node:path";

import { RESUME } from "@/cv/data";

/** Bump when the print LAYOUT changes without CV data changing. */
export const PRINT_LAYOUT_VERSION = 1;

export const CV_PDF_ROUTE = "/cv/print";
export const CV_PDF_PUBLIC_PATH = "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf";

const PUBLIC_DIR = join(process.cwd(), "public");
export const CV_PDF_OUTPUT_FILE = join(
  PUBLIC_DIR,
  "cv",
  "Leonardo-Sarmento-de-Castro-Resume.pdf",
);
export const CV_PDF_HASH_FILE = `${CV_PDF_OUTPUT_FILE}.hash`;

export const computeCvPdfContentHash = (): string =>
  createHash("sha256")
    .update(`v${PRINT_LAYOUT_VERSION}\n`)
    .update(JSON.stringify(RESUME))
    .digest("hex");
