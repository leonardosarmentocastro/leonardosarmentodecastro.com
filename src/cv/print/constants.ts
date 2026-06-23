/**
 * Static coordinates of the generated recruiter PDF: the route it is printed
 * from, the committed asset path the site links to, and the on-disk output /
 * hash locations the generator writes. See `hash.ts` for the freshness check
 * and `scripts/cv/generate-pdf.ts` for the writer.
 */
import { join } from "node:path";

/** Bump when the print LAYOUT changes without CV data changing. */
export const PRINT_LAYOUT_VERSION = 6;

export const CV_PDF_ROUTE = "/cv/print";
export const CV_PDF_PUBLIC_PATH = "/cv/pdf";

const PUBLIC_DIR = join(process.cwd(), "public");
export const CV_PDF_OUTPUT_FILE = join(
  PUBLIC_DIR,
  "cv",
  "Leonardo-Sarmento-de-Castro-Resume.pdf",
);
export const CV_PDF_HASH_FILE = `${CV_PDF_OUTPUT_FILE}.hash`;
