import type { Skill, WorkExperience } from "@/cv/types";

import type { AtsExperience, AtsSkillGroup } from "./types";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function stripFlags(value: string): string {
  return value.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
}

export function toExperience(entry: WorkExperience): AtsExperience {
  return {
    company: entry.company,
    role: entry.role,
    dateRange: `${entry.startDate} – ${entry.endDate}`,
    location: entry.location ?? capitalize(entry.workMode),
    bullets: entry.bullets,
    technologies: entry.technologies,
  };
}

/** "JavaScript — Expert · 10 yrs"; the years suffix is dropped for skills
 * flagged `omitExperienceBar` (e.g. a native language) or with no logged years. */
function skillEntry(skill: Skill): string {
  const base = `${skill.name} — ${skill.level}`;
  if (skill.omitExperienceBar || skill.years <= 0) {
    return base;
  }
  return `${base} · ${skill.years} yrs`;
}

export function groupSkills(skills: Skill[]): AtsSkillGroup[] {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skillEntry(skill));
    groups.set(skill.category, list);
  }
  return [...groups].map(([category, entries]) => ({ category, entries }));
}
