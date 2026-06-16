import { describe, expect, it } from "vitest";

import { Accordion } from "@/components/ui/Accordion";
import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

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
});
