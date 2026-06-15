"use client";

type Props = {
  /** Matches `data-checkpoint-id` on the row wrapper for scroll-driven styling */
  checkpointId: string;
};

/** Double-ring spine node — styles driven by `.cv-checkpoint-reached` on the row */
export const WorkTimelineNode = ({ checkpointId }: Props) => (
  <div
    className="cv-timeline-node-outer flex items-center justify-center w-4 h-4 rounded-full shrink-0"
    data-testid={`work-timeline-node-${checkpointId}`}
    aria-hidden
  >
    <div className="cv-timeline-node-inner w-2 h-2 rounded-full" />
  </div>
);
