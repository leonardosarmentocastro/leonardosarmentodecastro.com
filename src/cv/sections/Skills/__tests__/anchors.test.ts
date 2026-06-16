import { afterEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";

import { scrollToSkill, skillAnchorId } from "../anchors";

describe("skillAnchorId", () => {
  it("is deterministic for the same skill", () => {
    const skill = RESUME.skills[0];
    expect(skillAnchorId(skill)).toBe(skillAnchorId(skill));
  });

  it("slugifies skill name, stripping accents and spaces", () => {
    const skill = {
      ...RESUME.skills[0],
      name: "MongoDB / Redis (NoSQL)",
    };
    expect(skillAnchorId(skill)).toBe("skill-mongodb-redis-nosql");
  });

  it("is unique across every current skill", () => {
    const ids = RESUME.skills.map(skillAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("scrollToSkill", () => {
  const skill = RESUME.skills.find((s) => s.name === "TypeScript");
  if (!skill) throw new Error("TypeScript skill missing from RESUME");

  const mountTarget = () => {
    const el = document.createElement("div");
    el.id = skillAnchorId(skill);
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls the matching element into view", () => {
    const el = mountTarget();
    scrollToSkill(skill);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("adds the cv-flash class when motion is allowed", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    scrollToSkill(skill);
    expect(el.classList.contains("cv-flash")).toBe(true);
  });

  it("does NOT flash when reduced motion is preferred", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    scrollToSkill(skill);
    expect(el.classList.contains("cv-flash")).toBe(false);
  });

  it("is a no-op when no matching element is mounted", () => {
    expect(() => scrollToSkill(skill)).not.toThrow();
  });
});
