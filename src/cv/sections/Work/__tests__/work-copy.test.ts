import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { workEntryMetadata, workEntryTitle } from "../work-copy";

describe("work-copy", () => {
  it("formats PDF-style title with quoted company and optional via", () => {
    const pinterest = RESUME.workExperience[0];
    expect(workEntryTitle(pinterest)).toBe(
      'Senior Software Engineer at "Pinterest" (via nearshore agency)',
    );
  });

  it("formats metadata with workMode and date range", () => {
    const pinterest = RESUME.workExperience[0];
    expect(workEntryMetadata(pinterest)).toBe(
      `(remote) ${pinterest.startDate} – ${pinterest.endDate}`,
    );
  });
});
