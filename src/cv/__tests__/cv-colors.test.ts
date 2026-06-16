import { describe, expect, it } from "vitest";

import { CV_COLORS, workSpineFill, workSpineTrack } from "@/cv/cv-colors";

describe("cv-colors", () => {
  it("exports PDF brand hex values", () => {
    expect(CV_COLORS.accent).toBe("#3c78d8");
    expect(CV_COLORS.foreground).toBe("#2d2a24");
    expect(CV_COLORS.muted).toBe("#6c6965");
    expect(CV_COLORS.mutedAlt).toBe("#6d6964");
    expect(CV_COLORS.spineTrack).toBe("#c5d9f5");
  });

  it("exports blue-derived spine tailwind classes", () => {
    expect(workSpineTrack).toContain("c5d9f5");
    expect(workSpineFill).toContain("3c78d8");
  });
});
