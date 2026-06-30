import { describe, expect, it } from "vitest";

import { RESUME } from "../data";
import type { SkillCategory, SkillLevel } from "../types";

const VALID_LEVELS: ReadonlyArray<SkillLevel> = [
  "Expert",
  "Advanced",
  "Experienced",
];

const VALID_CATEGORIES: ReadonlyArray<SkillCategory> = [
  "Languages",
  "Frameworks",
  "Runtimes",
  "Databases",
  "Infrastructure",
  "AI",
  "Design",
  "CMS",
  "Communication",
];

describe("RESUME data shape", () => {
  it("has a non-empty name, role, blurb, and avatar in the hero", () => {
    expect(RESUME.hero.name).toBeTruthy();
    expect(RESUME.hero.role).toBeTruthy();
    expect(RESUME.hero.blurb.length).toBeGreaterThan(50);
    expect(RESUME.hero.avatar.startsWith("/")).toBe(true);
  });

  it("exposes every link consumers need", () => {
    const { links } = RESUME.hero;
    expect(links.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\//);
    expect(links.github).toMatch(/^https:\/\/github\.com\//);
    expect(links.email).toMatch(/@/);
    expect(links.whatsapp).toMatch(/^https:\/\/wa\.me\//);
    expect(links.whatsappMessage).toMatch(/^https:\/\/wa\.me\/.*text=/);
    expect(links.whatsappDisplay).toMatch(/^\+/);
    expect(links.site).toBe("https://leonardosarmentocastro.com");
    expect(links.resumePdf).toBe("/cv/Leonardo-Sarmento-de-Castro-Resume.pdf");
  });

  it("links the recruiter PDF to the generated local asset (not Google Drive)", () => {
    expect(RESUME.hero.links.resumePdf).toBe(
      "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
    );
  });

  it("has at least three about paragraphs", () => {
    expect(RESUME.about.length).toBeGreaterThanOrEqual(3);
    for (const p of RESUME.about) expect(p.length).toBeGreaterThan(20);
  });

  it("has every work entry populated with bullets, technologies and dates", () => {
    expect(RESUME.workExperience.length).toBeGreaterThan(0);
    for (const w of RESUME.workExperience) {
      expect(w.company).toBeTruthy();
      expect(w.role).toBeTruthy();
      expect(w.startDate).toBeTruthy();
      expect(w.endDate).toBeTruthy();
      expect(w.description.length).toBeGreaterThan(20);
      expect(w.bullets.length).toBeGreaterThanOrEqual(1);
      expect(w.technologies.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("has every work entry's date strings parseable to a 4-digit year", () => {
    for (const w of RESUME.workExperience) {
      expect(w.startDate).toMatch(/\d{4}/);
      if (w.endDate !== "Present") expect(w.endDate).toMatch(/\d{4}/);
    }
  });

  it("has at least one education entry", () => {
    expect(RESUME.education.length).toBeGreaterThanOrEqual(1);
    for (const e of RESUME.education) {
      expect(e.school).toBeTruthy();
      expect(e.degree).toBeTruthy();
      expect(e.period).toBeTruthy();
    }
  });

  it("constrains skills to the valid category and level enums with consistent dot counts", () => {
    expect(RESUME.skills.length).toBeGreaterThan(0);
    for (const s of RESUME.skills) {
      expect(VALID_CATEGORIES).toContain(s.category);
      expect(VALID_LEVELS).toContain(s.level);
      expect(s.totalDots).toBe(10);
      expect(s.filledDots).toBeGreaterThanOrEqual(0);
      expect(s.filledDots).toBeLessThanOrEqual(s.totalDots);
      expect(s.stars).toBeGreaterThanOrEqual(1);
      expect(s.stars).toBeLessThanOrEqual(5);
      expect(s.years).toBeGreaterThanOrEqual(0);
    }
  });

  it("orders milestones most-recent-first by year", () => {
    const years = RESUME.milestones.map((m) => m.year);
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeLessThanOrEqual(years[i - 1]);
    }
  });

  it("gives every work entry a valid lane and resolvable stickyThrough", () => {
    const companies = new Set(RESUME.workExperience.map((w) => w.company));
    for (const w of RESUME.workExperience) {
      expect(["left", "right"]).toContain(w.lane);
      if (w.stickyThrough) {
        expect(companies.has(w.stickyThrough)).toBe(true);
      }
    }
  });

  it("gives every skill at least one alias (its technology-string identities)", () => {
    for (const s of RESUME.skills) {
      expect(Array.isArray(s.aliases)).toBe(true);
      expect(s.aliases.length).toBeGreaterThanOrEqual(1);
      for (const alias of s.aliases)
        expect(alias.trim().length).toBeGreaterThan(0);
    }
  });
});
