import { NextResponse } from "next/server";

import { RESUME } from "@/cv/data";
import { toJsonResume } from "@/cv/export/json-resume";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(toJsonResume(RESUME), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
