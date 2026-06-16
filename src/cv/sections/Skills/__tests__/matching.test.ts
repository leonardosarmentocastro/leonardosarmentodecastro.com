import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import type { Skill } from "@/cv/types";

import { experiencesForSkill, skillForTechnology } from "../matching";

const skillNamed = (name: string): Skill => {
  const skill = RESUME.skills.find((s) => s.name === name);
  if (!skill) throw new Error(`No skill named ${name}`);
  return skill;
};

const withAliases = (name: string, aliases: string[]): Skill => ({
  ...skillNamed(name),
  aliases,
});

describe("experiencesForSkill", () => {
  it("matches entries by exact technology string, case-insensitively", () => {
    const result = experiencesForSkill(
      withAliases("JavaScript", ["javascript"]),
      RESUME.workExperience,
    );
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((e) =>
        e.technologies.some((t) => t.toLowerCase() === "javascript"),
      ),
    ).toBe(true);
  });

  it("does NOT match on substrings (Sanity must not match Sanity.io)", () => {
    const companies = experiencesForSkill(
      withAliases("CMS (Sanity, Payload, etc)", ["Sanity"]),
      RESUME.workExperience,
    ).map((e) => e.company);
    expect(companies).toContain("Pinterest"); // technologies include "Sanity"
    expect(companies).not.toContain("PairTree"); // technologies include "Sanity.io"
  });

  it("matches any of several aliases (MongoDB / Redis)", () => {
    const companies = experiencesForSkill(
      withAliases("MongoDB / Redis (NoSQL)", ["MongoDB", "Redis"]),
      RESUME.workExperience,
    ).map((e) => e.company);
    expect(companies).toContain("Écolheita"); // MongoDB
    expect(companies).toContain("Daitan Group"); // Redis
  });

  it("preserves most-recent-first input order", () => {
    const result = experiencesForSkill(
      withAliases("JavaScript", ["JavaScript"]),
      RESUME.workExperience,
    );
    const indices = result.map((e) => RESUME.workExperience.indexOf(e));
    const ascending = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(ascending);
  });

  it("returns [] when no technology matches", () => {
    expect(
      experiencesForSkill(
        withAliases("JavaScript", ["NonexistentTech"]),
        RESUME.workExperience,
      ),
    ).toEqual([]);
  });

  it("resolves every real skill in RESUME to at least one experience", () => {
    for (const skill of RESUME.skills) {
      expect(
        experiencesForSkill(skill, RESUME.workExperience).length,
      ).toBeGreaterThan(0);
    }
  });
});

describe("skillForTechnology", () => {
  it("returns the skill whose alias matches exactly, case-insensitively", () => {
    const skill = skillForTechnology("javascript", RESUME.skills);
    expect(skill?.name).toBe("JavaScript");
  });

  it("does NOT match on substrings (Sanity.io must not resolve to Sanity skill)", () => {
    const skill = skillForTechnology("Sanity.io", RESUME.skills);
    expect(skill).toBeNull();
  });

  it("returns the Sanity CMS skill for exact Sanity token", () => {
    const skill = skillForTechnology("Sanity", RESUME.skills);
    expect(skill?.name).toBe("CMS (Sanity, Payload, etc)");
  });

  it("returns null for unknown technology strings", () => {
    expect(skillForTechnology("Java", RESUME.skills)).toBeNull();
    expect(skillForTechnology("NonexistentTech", RESUME.skills)).toBeNull();
  });

  it("round-trips with experiencesForSkill for every skill alias in work data", () => {
    const aliasSet = new Set(
      RESUME.workExperience.flatMap((e) => e.technologies),
    );
    for (const skill of RESUME.skills) {
      for (const alias of skill.aliases) {
        if (!aliasSet.has(alias)) continue;
        const resolved = skillForTechnology(alias, RESUME.skills);
        expect(resolved?.name).toBe(skill.name);
        expect(experiencesForSkill(skill, RESUME.workExperience).length).toBeGreaterThan(0);
      }
    }
  });
});
