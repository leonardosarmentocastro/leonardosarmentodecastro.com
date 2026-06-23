"use client";

import { Accordion } from "@/components/ui/Accordion";
import { workSpineFill } from "@/cv/cv-colors";
import { RESUME } from "@/cv/data";
import { workEntryAnchorId } from "@/cv/sections/Work/anchors";
import { splitMilestoneText } from "@/cv/sections/Work/milestone-text";
import { buildTimelineItems } from "@/cv/sections/Work/timeline-layout";
import {
  WorkTimelineDatePill,
  WorkTimelineItem,
} from "@/cv/sections/Work/WorkTimelineItem";

/** Static dot centered on the left spine. */
const PrintNode = () => (
  <div
    data-testid="work-print-node"
    className="absolute -left-[1.6875rem] top-0 z-10 flex h-7 w-4 items-center justify-center"
  >
    <span
      className={`block h-3.5 w-3.5 rounded-full border-[3px] border-white ${workSpineFill} ring-1 ring-[#3c78d8]`}
    />
  </div>
);

const PrintMilestone = ({ text }: { text: string }) => {
  const { emoji, body } = splitMilestoneText(text);
  return (
    <div
      className="relative z-10 w-full py-8"
      data-testid="work-print-milestone"
      role="note"
      aria-label={text}
    >
      <p className="px-6 text-center font-spectral text-sm text-[#6c6965] italic">
        {emoji ? <span className="mr-1 inline-block">{emoji}</span> : null}
        <span>{body}</span>
      </p>
    </div>
  );
};

export const WorkPrintTimeline = () => {
  const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
  const allIds = RESUME.workExperience.map(workEntryAnchorId);

  return (
    // The page-break lives on this plain block <section>, not the inner flex
    // column: Chromium ignores forced `break-before: page` on flex containers.
    <section id="work" className="cv-print-page-break-before">
      <div className="flex flex-col gap-8">
        <h2 className="font-domine text-[#2d2a24] text-xl tracking-tight">
          Work Experience
        </h2>

        <div className="relative pl-8">
          {/* solid static spine */}
          <div
            className={`absolute top-3.5 bottom-0 left-3 z-0 w-0.5 ${workSpineFill}`}
          />

          <Accordion
            multiple
            value={allIds}
            onValueChange={() => {}}
            className="relative z-10 flex flex-col gap-10"
          >
            {items.map((item, i) => {
              if (item.kind === "milestone") {
                return (
                  <PrintMilestone
                    key={`m-${item.milestone.year}-${i}`}
                    text={item.milestone.text}
                  />
                );
              }
              const { entry } = item;
              return (
                <div
                  key={`${entry.company}-${entry.startDate}`}
                  className="cv-print-work-entry relative w-full"
                  data-testid="work-print-entry"
                >
                  <PrintNode />
                  <WorkTimelineDatePill
                    entry={entry}
                    align="start"
                    placement="mobile"
                    className="relative z-20 flex"
                  />
                  <WorkTimelineItem
                    entry={entry}
                    isOpen
                    showHeaderAnimation={false}
                    showBodyAnimation={false}
                    suppressMobilePeriod
                  />
                </div>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
