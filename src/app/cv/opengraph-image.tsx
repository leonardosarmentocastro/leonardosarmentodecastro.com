// src/app/cv/opengraph-image.tsx
import { RESUME } from "@/cv/data";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/seo/og/constants";
import { renderOpenGraphCard } from "@/seo/og/OpenGraphCard";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — CV";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOpenGraphCard({ label: RESUME.hero.kicker });
}
