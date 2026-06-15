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

/**
 * Scroll to a work entry and briefly flash it. Smooth-scroll and the flash
 * are gated behind `prefers-reduced-motion: no-preference`; reduced-motion
 * users get an instant jump with no flash. No-ops if the element is absent.
 */
export const scrollToWorkEntry = (entry: WorkExperience): void => {
  const el = document.getElementById(workEntryAnchorId(entry));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });

  document.dispatchEvent(
    new CustomEvent("cv:open-work-entry", {
      detail: workEntryAnchorId(entry),
    }),
  );

  if (!motionOk) return;

  el.classList.add("cv-flash");
  el.addEventListener("animationend", () => el.classList.remove("cv-flash"), {
    once: true,
  });
};
