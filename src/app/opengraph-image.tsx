// src/app/opengraph-image.tsx
// og-card-version: 2 — bump when the card design changes so Next emits a new
// ?<hash> on the og:image URL and crawlers (LinkedIn, etc.) refetch the image.
import { RESUME } from "@/cv/data";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/seo/og/constants";
import { renderOpenGraphCard } from "@/seo/og/OpenGraphCard";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — Senior Software Engineer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOpenGraphCard({ label: RESUME.hero.kicker });
}
