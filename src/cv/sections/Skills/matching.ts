import type { Skill, WorkExperience } from "@/cv/types";

/**
 * Work experiences whose technologies include any of the skill's aliases.
 * Comparison is case-insensitive but EXACT per token (no substring), so
 * "Sanity" matches "Sanity" but not "Sanity.io". Input order is preserved.
 */
export const experiencesForSkill = (
  skill: Skill,
  entries: ReadonlyArray<WorkExperience>,
): WorkExperience[] => {
  const aliases = new Set(skill.aliases.map((a) => a.toLowerCase()));
  return entries.filter((entry) =>
    entry.technologies.some((tech) => aliases.has(tech.toLowerCase())),
  );
};
