import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderAtsPdf } from "../AtsResumeDocument";
import { buildAtsResume } from "../ats-view-model";

describe("renderAtsPdf", () => {
  it("produces a non-empty PDF buffer", async () => {
    const pdf = await renderAtsPdf(buildAtsResume(RESUME));
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  }, 30000);
});
