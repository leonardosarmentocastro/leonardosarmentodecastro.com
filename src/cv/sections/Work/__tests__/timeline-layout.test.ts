import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import type { WorkExperience } from "@/cv/types";

import {
  buildTimelineItems,
  datesOverlap,
  findStickyGroupForEntry,
  parseWorkDate,
} from "../timeline-layout";

const workEntry = (company: string): WorkExperience => {
  const entry = RESUME.workExperience.find((w) => w.company === company);
  expect(entry).toBeDefined();
  return entry as WorkExperience;
};

describe("parseWorkDate", () => {
  it("parses Mon YYYY strings", () => {
    expect(parseWorkDate("Jun 2021")).toEqual({ year: 2021, month: 6 });
  });

  it('treats "Present" as far future', () => {
    const d = parseWorkDate("Present");
    expect(d.year).toBeGreaterThanOrEqual(2026);
  });
});

describe("datesOverlap", () => {
  it("detects Écolheita overlapping PairTree", () => {
    expect(datesOverlap(workEntry("Écolheita"), workEntry("PairTree"))).toBe(
      true,
    );
  });

  it("returns false for non-overlapping entries", () => {
    expect(datesOverlap(workEntry("Dash"), workEntry("Pinterest"))).toBe(false);
  });
});

describe("findStickyGroupForEntry", () => {
  it("returns a sticky group for Écolheita through PairTree", () => {
    const group = findStickyGroupForEntry(
      workEntry("Écolheita"),
      RESUME.workExperience,
    );
    expect(group).not.toBeNull();
    if (!group) return;
    expect(group.stickyEntry.company).toBe("Écolheita");
    expect(group.throughEntry.company).toBe("PairTree");
    expect(group.counterpartEntries.map((e) => e.company)).toEqual(
      expect.arrayContaining(["PairTree", "PureCars", "Radical Imaging"]),
    );
  });

  it("returns null for entries without stickyThrough", () => {
    expect(
      findStickyGroupForEntry(workEntry("Pinterest"), RESUME.workExperience),
    ).toBeNull();
  });
});

describe("buildTimelineItems", () => {
  it("interleaves milestones before matching work entries", () => {
    const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
    const milestoneIdx = items.findIndex(
      (i) => i.kind === "milestone" && i.milestone.year === 2026,
    );
    const firstWorkIdx = items.findIndex((i) => i.kind === "work");
    expect(milestoneIdx).toBeGreaterThanOrEqual(0);
    expect(milestoneIdx).toBeLessThan(firstWorkIdx);
  });
});
