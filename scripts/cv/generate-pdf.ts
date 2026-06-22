import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import puppeteer from "puppeteer";

import {
  CV_PDF_HASH_FILE,
  CV_PDF_OUTPUT_FILE,
  CV_PDF_ROUTE,
  computeCvPdfContentHash,
} from "@/cv/print/pdf-asset";

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
