import type { Education, Skill, SkillLevel, WorkExperience } from "@/cv/types";

import type {
  JsonResumeEducation,
  JsonResumeLanguage,
  JsonResumeProfile,
  JsonResumeSkill,
  JsonResumeWork,
} from "./types";

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const COUNTRY_CODES: Record<string, string> = { Brazil: "BR" };

const FLUENCY_BY_LEVEL: Record<SkillLevel, string> = {
  Expert: "Native or bilingual proficiency",
  Advanced: "Professional working proficiency",
  Experienced: "Limited working proficiency",
};

/** "Aug 2024" -> "2024-08". Throws on unrecognized input. */
export function toIsoMonth(value: string): string {
  const [month, year] = value.trim().split(/\s+/);
  const mm = MONTHS[month];
  if (!mm || !/^\d{4}$/.test(year ?? "")) {
    throw new Error(`Unrecognized month value: "${value}"`);
  }
  return `${year}-${mm}`;
}

/** "São José dos Campos, São Paulo — Brazil 🇧🇷" -> structured location. */
export function parseLocation(raw: string) {
  const noFlag = raw.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
  const [city = "", rest = ""] = noFlag.split(",").map((s) => s.trim());
  const [region = "", country = ""] = rest.split("—").map((s) => s.trim());
  return { city, region, countryCode: COUNTRY_CODES[country] ?? country };
}

export function profileFromUrl(
  network: string,
  url: string,
): JsonResumeProfile {
  const username = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return { network, username, url };
}

export function toWork(entry: WorkExperience): JsonResumeWork {
  const work: JsonResumeWork = {
    name: entry.company,
    position: entry.role,
    startDate: toIsoMonth(entry.startDate),
    summary: entry.description,
    highlights: entry.bullets,
    keywords: entry.technologies,
  };
  if (entry.endDate !== "Present") {
    work.endDate = toIsoMonth(entry.endDate);
  }
  return work;
}

/** Education period "2009 — 2011" -> { startDate, endDate }. */
function parseEducationPeriod(period: string) {
  const [startDate = "", endDate = ""] = period.split("—").map((s) => s.trim());
  return { startDate, endDate };
}

export function toEducation(entry: Education): JsonResumeEducation {
  return {
    institution: entry.school,
    studyType: entry.degree,
    ...parseEducationPeriod(entry.period),
  };
}

export function toSkill(skill: Skill): JsonResumeSkill {
  const result: JsonResumeSkill = {
    name: skill.name,
    level: skill.level,
    keywords: skill.aliases,
  };
  if (!skill.omitExperienceBar && skill.years > 0) {
    result.yearsOfExperience = skill.years;
  }
  return result;
}

export function toLanguage(skill: Skill): JsonResumeLanguage {
  return {
    language: skill.name,
    fluency: FLUENCY_BY_LEVEL[skill.level],
  };
}
