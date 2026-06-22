import { RESUME } from "@/cv/data";
import { renderAtsPdf } from "@/cv/export/ats/AtsResumePDF";
import { buildAtsResume } from "@/cv/export/ats/build-ats-resume";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pdf = await renderAtsPdf(buildAtsResume(RESUME));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    },
  });
}
