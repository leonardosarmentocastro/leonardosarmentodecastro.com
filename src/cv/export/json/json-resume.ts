import type { Resume } from "@/cv/types";

import {
  parseLocation,
  profileFromUrl,
  toEducation,
  toLanguage,
  toSkill,
  toWork,
} from "./helpers";
import type { JsonResume } from "./types";

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
    education: resume.education.map(toEducation),
    skills: technical.map(toSkill),
    languages: languages.map(toLanguage),
  };
}
