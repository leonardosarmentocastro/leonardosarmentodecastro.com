import type { Resume } from "@/cv/types";

import { groupSkills, stripFlags, toExperience } from "./helpers";
import type { AtsResume } from "./types";

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
