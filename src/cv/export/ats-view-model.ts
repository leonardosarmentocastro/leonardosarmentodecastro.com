import type { Resume, Skill, WorkExperience } from "@/cv/types";

type AtsExperience = {
  company: string;
  role: string;
  dateRange: string;
  location: string;
  bullets: string[];
  technologies: string[];
};

type AtsEducation = {
  school: string;
  degree: string;
  period: string;
};

type AtsSkillGroup = {
  category: string;
  entries: string[];
};

export type AtsResume = {
  name: string;
  headline: string;
  contact: string;
  links: string[];
  summary: string;
  skills: AtsSkillGroup[];
  experience: AtsExperience[];
  education: AtsEducation[];
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function stripFlags(value: string): string {
  return value.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
}

function toExperience(entry: WorkExperience): AtsExperience {
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

function groupSkills(skills: Skill[]): AtsSkillGroup[] {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skillEntry(skill));
    groups.set(skill.category, list);
  }
  return [...groups].map(([category, entries]) => ({ category, entries }));
}

export function buildAtsResume(resume: Resume): AtsResume {
  return {
    name: resume.hero.name,
    headline: resume.hero.role,
    contact: [
      stripFlags(resume.hero.location),
      resume.hero.links.email,
      resume.hero.links.whatsappDisplay,
      resume.hero.links.site,
    ].join("  ·  "),
    links: [
      `LinkedIn: ${resume.hero.links.linkedin}`,
      `GitHub: ${resume.hero.links.github}`,
    ],
    summary: resume.hero.blurb,
    skills: groupSkills(resume.skills),
    experience: resume.workExperience.map(toExperience),
    education: resume.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      period: e.period,
    })),
  };
}
