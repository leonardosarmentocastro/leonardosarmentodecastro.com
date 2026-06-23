import { readFile } from "node:fs/promises";

import { CV_PDF_OUTPUT_FILE } from "@/cv/print/constants";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pdf = await readFile(CV_PDF_OUTPUT_FILE);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    },
  });
}
