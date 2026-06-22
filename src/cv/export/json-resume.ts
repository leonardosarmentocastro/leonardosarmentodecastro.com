import type { Resume, SkillLevel, WorkExperience } from "@/cv/types";

export type JsonResumeProfile = {
  network: string;
  username: string;
  url: string;
};

export type JsonResumeBasics = {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: { city: string; region: string; countryCode: string };
  profiles: JsonResumeProfile[];
};

export type JsonResumeWork = {
  name: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary: string;
  highlights: string[];
  keywords: string[];
};

export type JsonResumeEducation = {
  institution: string;
  studyType: string;
  startDate: string;
  endDate: string;
};

export type JsonResumeSkill = {
  name: string;
  level: string;
  keywords: string[];
};

export type JsonResumeLanguage = {
  language: string;
  fluency: string;
};

export type JsonResume = {
  $schema: string;
  basics: JsonResumeBasics;
  work: JsonResumeWork[];
  education: JsonResumeEducation[];
  skills: JsonResumeSkill[];
  languages: JsonResumeLanguage[];
};

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

function profileFromUrl(network: string, url: string): JsonResumeProfile {
  const username = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return { network, username, url };
}

function toWork(entry: WorkExperience): JsonResumeWork {
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

export function toJsonResume(resume: Resume): JsonResume {
  const languages = resume.skills.filter((s) => s.category === "Communication");
  const technical = resume.skills.filter((s) => s.category !== "Communication");

  return {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: resume.hero.name,
      label: resume.hero.role,
      email: resume.hero.links.email,
      phone: resume.hero.links.whatsappDisplay,
      url: resume.hero.links.site,
      summary: resume.hero.blurb,
      location: parseLocation(resume.hero.location),
      profiles: [
        profileFromUrl("LinkedIn", resume.hero.links.linkedin),
        profileFromUrl("GitHub", resume.hero.links.github),
      ],
    },
    work: resume.workExperience.map(toWork),
    education: resume.education.map((e) => ({
      institution: e.school,
      studyType: e.degree,
      ...parseEducationPeriod(e.period),
    })),
    skills: technical.map((s) => ({
      name: s.name,
      level: s.level,
      keywords: s.aliases,
    })),
    languages: languages.map((s) => ({
      language: s.name,
      fluency: FLUENCY_BY_LEVEL[s.level],
    })),
  };
}
