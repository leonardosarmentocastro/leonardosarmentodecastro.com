import { describe, expect, it } from "vitest";

import { Accordion } from "@/components/ui/Accordion";
import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { workEntryAnchorId } from "../anchors";
import { WorkTimelineItem } from "../WorkTimelineItem";

describe("WorkTimelineItem", () => {
  it("sets data-header-animated when showHeaderAnimation is true", () => {
    renderWithProviders(
      <Accordion value={[]} onValueChange={() => {}}>
        <WorkTimelineItem
          entry={RESUME.workExperience[0]}
          isOpen={false}
          showHeaderAnimation
        />
      </Accordion>,
    );
    expect(screen.getByTestId("work-entry-Pinterest")).toHaveAttribute(
      "data-header-animated",
      "true",
    );
  });

  it("tags the description so print can space it from the bullets", () => {
    const entry = RESUME.workExperience[0];
    renderWithProviders(
      <Accordion value={[workEntryAnchorId(entry)]} onValueChange={() => {}}>
        <WorkTimelineItem entry={entry} isOpen />
      </Accordion>,
    );
    // The description renders inline in print; this class lets the print
    // stylesheet make it a block so its bottom margin separates it from the
    // bullet list (which is invisible while it stays an inline span).
    expect(screen.getByText(entry.description)).toHaveClass(
      "cv-print-work-description",
    );
  });
});
