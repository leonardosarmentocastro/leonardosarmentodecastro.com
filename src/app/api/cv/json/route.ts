import { NextResponse } from "next/server";

import { RESUME } from "@/cv/data";
import { buildJsonResume } from "@/cv/export/json/build-json-resume";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(buildJsonResume(RESUME), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
