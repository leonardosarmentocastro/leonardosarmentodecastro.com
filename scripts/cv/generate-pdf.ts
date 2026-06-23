/**
 * Generates the committed recruiter PDF (`public/cv/...pdf`) by printing the
 * live `/cv/print` page with headless Chrome.
 *
 * Why print the real route instead of authoring a PDF from scratch: the print
 * page is the single source of truth for the CV's layout, so the exported PDF
 * can never drift from what the site actually renders.
 *
 * This is a manual/offline step (`pnpm cv:pdf`), deliberately NOT part of the
 * Vercel build — the PDF is committed to the repo and a content-hash test
 * (`print/__tests__/hash.test.ts`) fails CI when it goes stale. Keeping
 * Puppeteer out of the build avoids shipping a Chromium download to every
 * deploy. See `src/cv/README.md` for the regeneration workflow.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import puppeteer from "puppeteer";

import {
  CV_PDF_HASH_FILE,
  CV_PDF_OUTPUT_FILE,
  CV_PDF_ROUTE,
} from "@/cv/print/constants";
import { computeCvPdfContentHash } from "@/cv/print/hash";

// Render against a server that's already serving the site. Defaults to a local
// server; override with CV_PDF_BASE_URL to target a preview/production deploy.
const BASE_URL = process.env.CV_PDF_BASE_URL ?? "http://localhost:3000";

async function main() {
  const url = `${BASE_URL}${CV_PDF_ROUTE}`;
  const browser = await puppeteer.launch({
    headless: true,
    // Required for headless Chrome in sandboxed/CI Linux environments.
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const page = await browser.newPage();
    // `networkidle0` waits until the page stops making requests so fonts,
    // images and icons are painted before we snapshot. This requires a
    // PRODUCTION server (`pnpm build && pnpm start`): the dev server keeps an
    // HMR WebSocket open, so it never goes idle and this would hang until the
    // timeout below.
    const res = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60_000,
    });
    if (!res || !res.ok()) {
      throw new Error(
        `Failed to load ${url} (status ${res?.status()}). Is the server running?`,
      );
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    mkdirSync(dirname(CV_PDF_OUTPUT_FILE), { recursive: true });
    writeFileSync(CV_PDF_OUTPUT_FILE, pdf);
    // Write the freshness hash alongside the PDF so the hash test can tell when
    // the committed PDF no longer matches the current CV data / layout.
    writeFileSync(CV_PDF_HASH_FILE, `${computeCvPdfContentHash()}\n`);
    console.log(`Wrote ${CV_PDF_OUTPUT_FILE}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
