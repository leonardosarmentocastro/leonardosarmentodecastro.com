import type { WorkExperience } from "@/cv/types";

/**
 * Stable, URL-safe DOM id for a work entry, derived from company + startDate
 * (mirrors the React key pattern `${company}-${startDate}`). Accents are
 * stripped so ids stay ASCII.
 */
export const workEntryAnchorId = (entry: WorkExperience): string => {
  const slug = `${entry.company} ${entry.startDate}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `work-${slug}`;
};
