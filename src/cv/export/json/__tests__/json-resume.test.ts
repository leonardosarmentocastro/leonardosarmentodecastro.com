import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { toJsonResume } from "../json-resume";

describe("toJsonResume", () => {
  const json = toJsonResume(RESUME);

  it("maps basics from the hero", () => {
    expect(json.basics.name).toBe(RESUME.hero.name);
    expect(json.basics.label).toBe(RESUME.hero.role);
    expect(json.basics.summary).toBe(RESUME.hero.blurb);
    expect(json.basics.email).toBe(RESUME.hero.links.email);
    expect(json.basics.phone).toBe(RESUME.hero.links.whatsappDisplay);
    expect(json.basics.url).toBe(RESUME.hero.links.site);
  });

  it("builds LinkedIn and GitHub profiles", () => {
    const networks = json.basics.profiles.map((p) => p.network);
    expect(networks).toEqual(["LinkedIn", "GitHub"]);
    const github = json.basics.profiles.find((p) => p.network === "GitHub");
    expect(github?.username).toBe("leonardosarmentocastro");
  });

  it("includes per-job technologies as work[].keywords", () => {
    const pinterest = json.work.find((w) => w.name === "Pinterest");
    expect(pinterest?.keywords).toEqual(RESUME.workExperience[0].technologies);
    expect(pinterest?.keywords).toContain("TypeScript");
  });

  it("maps start/end dates to ISO months", () => {
    const pinterest = json.work.find((w) => w.name === "Pinterest");
    expect(pinterest?.startDate).toBe("2024-08");
    expect(pinterest?.endDate).toBe("2026-05");
  });

  it("omits endDate for ongoing roles ('Present')", () => {
    const withPresent: typeof RESUME = {
      ...RESUME,
      workExperience: [
        { ...RESUME.workExperience[0], endDate: "Present" },
        ...RESUME.workExperience.slice(1),
      ],
    };
    const result = toJsonResume(withPresent);
    expect(result.work[0]).not.toHaveProperty("endDate");
    expect(result.work[0].startDate).toBe("2024-08");
  });

  it("maps Communication skills into languages, not skills", () => {
    expect(json.languages.map((l) => l.language)).toEqual([
      "English",
      "Portuguese",
    ]);
    expect(
      json.languages.find((l) => l.language === "Portuguese")?.fluency,
    ).toBe("Native or bilingual proficiency");
    expect(json.skills.some((s) => s.name === "English")).toBe(false);
  });

  it("maps technical skills with aliases as keywords", () => {
    const js = json.skills.find((s) => s.name === "JavaScript");
    expect(js?.level).toBe("Expert");
    expect(js?.keywords).toEqual(["JavaScript"]);
  });

  it("annotates technical skills with self-assessed years of experience", () => {
    const js = json.skills.find((s) => s.name === "JavaScript");
    expect(js?.yearsOfExperience).toBe(10);
    const ts = json.skills.find((s) => s.name === "TypeScript");
    expect(ts?.yearsOfExperience).toBe(8);
  });

  it("does not include milestones anywhere", () => {
    expect(JSON.stringify(json)).not.toContain("Looking for new opportunities");
  });

  it("derives education start/end from the period", () => {
    expect(json.education[0].institution).toBe(RESUME.education[0].school);
    expect(json.education[0].startDate).toBe("2009");
    expect(json.education[0].endDate).toBe("2011");
  });
});
