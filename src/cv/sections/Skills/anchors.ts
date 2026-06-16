import type { Skill } from "@/cv/types";

/**
 * Stable, URL-safe DOM id for a skill card, derived from skill.name.
 * Accents are stripped so ids stay ASCII.
 */
export const skillAnchorId = (skill: Skill): string => {
  const slug = skill.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `skill-${slug}`;
};

/**
 * Scroll to a skill card and briefly flash it. Smooth-scroll and the flash
 * are gated behind `prefers-reduced-motion: no-preference`; reduced-motion
 * users get an instant jump with no flash. No-ops if the element is absent.
 */
export const scrollToSkill = (skill: Skill): void => {
  const el = document.getElementById(skillAnchorId(skill));
  if (!el) return;

  const motionOk = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  ).matches;

  el.scrollIntoView({ behavior: motionOk ? "smooth" : "auto", block: "start" });

  if (!motionOk) return;

  el.classList.add("cv-flash");
  el.addEventListener("animationend", () => el.classList.remove("cv-flash"), {
    once: true,
  });
};
