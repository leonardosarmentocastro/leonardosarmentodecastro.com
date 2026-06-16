import { describe, expect, it } from "vitest";

import { splitMilestoneText } from "../milestone-text";

describe("splitMilestoneText", () => {
  it("splits leading emoji from body", () => {
    expect(splitMilestoneText("🎉 2016 — Ascended to senior")).toEqual({
      emoji: "🎉",
      body: "2016 — Ascended to senior",
    });
  });

  it("returns empty emoji when none present", () => {
    expect(splitMilestoneText("2016 — text")).toEqual({
      emoji: "",
      body: "2016 — text",
    });
  });
});
