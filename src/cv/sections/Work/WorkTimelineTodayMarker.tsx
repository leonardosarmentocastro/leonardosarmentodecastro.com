"use client";

import { workDatePillDefault } from "@/cv/cv-colors";
import { formatTodayTimelineDate } from "./timeline-layout";
import { WorkTimelineNode } from "./WorkTimelineNode";

/** Timeline origin — today's date on the spine, always active. */
export const WorkTimelineTodayMarker = () => {
  const today = formatTodayTimelineDate();

  return (
    <div
      className="cv-work-checkpoint cv-timeline-today cv-checkpoint-reached relative md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-2 md:items-start w-full mb-10"
      data-checkpoint-id="today"
      data-testid="work-timeline-today"
      role="note"
      aria-label={`Timeline starts at ${today}`}
    >
      <div className="absolute -left-[1.6875rem] top-0 flex h-7 w-4 items-center justify-center z-10 md:static md:col-start-2 md:self-start shrink-0">
        <WorkTimelineNode checkpointId="today" />
      </div>

      <div className="flex md:hidden h-7 items-center">
        <span
          className={workDatePillDefault}
          data-testid="work-date-pill-today"
        >
          {today}
        </span>
      </div>

      <div className="hidden md:flex md:col-start-3 min-w-0 h-7 items-center justify-start">
        <span
          className={workDatePillDefault}
          data-testid="work-date-pill-today-desktop"
        >
          {today}
        </span>
      </div>
    </div>
  );
};
