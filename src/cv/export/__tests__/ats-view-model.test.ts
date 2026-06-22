import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { buildAtsResume } from "../ats-view-model";

describe("buildAtsResume", () => {
  const ats = buildAtsResume(RESUME);

  it("carries name, headline and summary from the hero", () => {
    expect(ats.name).toBe(RESUME.hero.name);
    expect(ats.headline).toBe(RESUME.hero.role);
    expect(ats.summary).toBe(RESUME.hero.blurb);
  });

  it("builds a flag-free contact line containing the email", () => {
    expect(ats.contact).toContain(RESUME.hero.links.email);
    expect(ats.contact).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
  });

  it("lists LinkedIn and GitHub links", () => {
    expect(ats.links.some((l) => l.includes(RESUME.hero.links.linkedin))).toBe(
      true,
    );
    expect(ats.links.some((l) => l.includes(RESUME.hero.links.github))).toBe(
      true,
    );
  });

  it("includes every work entry with a date range", () => {
    expect(ats.experience).toHaveLength(RESUME.workExperience.length);
    expect(ats.experience[0].dateRange).toBe(
      `${RESUME.workExperience[0].startDate} – ${RESUME.workExperience[0].endDate}`,
    );
  });

  it("falls back to capitalized work mode when location is absent", () => {
    const pinterest = ats.experience.find((e) => e.company === "Pinterest");
    expect(pinterest?.location).toBe("Remote");
    const spark = ats.experience.find((e) => e.company === "Spark Networks");
    expect(spark?.location).toBe("Berlin, Germany");
  });

  it("groups skills by category", () => {
    const categories = ats.skills.map((g) => g.category);
    expect(categories).toContain("Languages");
    expect(categories).toContain("Communication");
    const languages = ats.skills.find((g) => g.category === "Languages");
    expect(languages?.entries.some((e) => e.startsWith("JavaScript"))).toBe(
      true,
    );
  });

  it("maps education entries verbatim", () => {
    expect(ats.education[0]).toEqual({
      school: RESUME.education[0].school,
      degree: RESUME.education[0].degree,
      period: RESUME.education[0].period,
    });
  });

  it("carries each job's technologies for the ATS to parse", () => {
    const pinterest = ats.experience.find((e) => e.company === "Pinterest");
    expect(pinterest?.technologies).toEqual(
      RESUME.workExperience[0].technologies,
    );
    expect(pinterest?.technologies).toContain("TypeScript");
  });

  it("annotates technical skills with self-assessed years of experience", () => {
    const languages = ats.skills.find((g) => g.category === "Languages");
    expect(languages?.entries).toContain("JavaScript — Expert · 10 yrs");
    expect(languages?.entries).toContain("TypeScript — Advanced · 8 yrs");
  });

  it("omits the years suffix for skills without an experience bar", () => {
    const communication = ats.skills.find(
      (g) => g.category === "Communication",
    );
    expect(communication?.entries).toContain("Portuguese — Expert");
    expect(
      communication?.entries.some(
        (e) => e.includes("Portuguese") && e.includes("yrs"),
      ),
    ).toBe(false);
  });
});
