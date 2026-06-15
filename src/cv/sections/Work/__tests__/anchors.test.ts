import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { workEntryAnchorId } from "../anchors";

describe("workEntryAnchorId", () => {
  it("is deterministic for the same entry", () => {
    const entry = RESUME.workExperience[0];
    expect(workEntryAnchorId(entry)).toBe(workEntryAnchorId(entry));
  });

  it("slugifies company + startDate, stripping accents and spaces", () => {
    const entry = {
      ...RESUME.workExperience[0],
      company: "Quero Educação",
      startDate: "Sep 2020",
    };
    expect(workEntryAnchorId(entry)).toBe("work-quero-educacao-sep-2020");
  });

  it("is unique across every current work entry", () => {
    const ids = RESUME.workExperience.map(workEntryAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
