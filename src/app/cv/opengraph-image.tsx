// src/app/cv/opengraph-image.tsx
import { RESUME } from "@/cv/data";
import { renderOgCard } from "@/og/card";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/og/constants";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — CV";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({ label: RESUME.hero.kicker });
}
