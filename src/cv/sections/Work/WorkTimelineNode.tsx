"use client";

type Props = {
  /** Matches `data-checkpoint-id` on the row wrapper for scroll-driven styling */
  checkpointId: string;
};

/** Double-ring spine node with optional ping when checkpoint is reached */
export const WorkTimelineNode = ({ checkpointId }: Props) => (
  <div
    className="relative flex size-4 items-center justify-center shrink-0"
    data-testid={`work-timeline-node-${checkpointId}`}
  >
    <span
      className="cv-timeline-node-ping absolute inline-flex size-full rounded-full bg-neutral-500 opacity-75 motion-safe:animate-ping motion-reduce:hidden"
      aria-hidden
    />
    <div
      className="cv-timeline-node-outer relative flex items-center justify-center size-4 rounded-full"
      aria-hidden
    >
      <div className="cv-timeline-node-inner size-2 rounded-full" />
    </div>
  </div>
);
