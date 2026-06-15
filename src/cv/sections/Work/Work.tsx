"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { RESUME } from "@/cv/data";
import type { WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import {
  buildTimelineItems,
  findStickyGroupForEntry,
  isStickyCounterpart,
} from "./timeline-layout";
import { WorkMilestoneDivider } from "./WorkMilestoneDivider";
import { WorkTimelineDatePill, WorkTimelineItem } from "./WorkTimelineItem";
import { WorkTimelineNode } from "./WorkTimelineNode";
import { workSpineFill, workSpineTrack } from "./work-colors";

gsap.registerPlugin(ScrollTrigger);

const syncCheckpointStates = (
  timeline: HTMLElement,
  progress: number,
): void => {
  const fillEdge = progress * timeline.offsetHeight;

  for (const row of timeline.querySelectorAll<HTMLElement>(
    ".cv-work-checkpoint",
  )) {
    const node = row.querySelector<HTMLElement>(".cv-timeline-node-outer");
    if (!node) continue;

    const timelineTop = timeline.getBoundingClientRect().top;
    const nodeCenterY =
      node.getBoundingClientRect().top +
      node.getBoundingClientRect().height / 2 -
      timelineTop;

    row.classList.toggle("cv-checkpoint-reached", fillEdge >= nodeCenterY);
  }
};

const TimelineEntryRow = ({
  entry,
  isOpen,
  /** Overlap cluster: pill above card (same column) to avoid z-fighting */
  dateOnCard = false,
  /** Overlap cluster: limit hit target to the card column only */
  stickyPointerPassThrough = false,
}: {
  entry: WorkExperience;
  isOpen: boolean;
  dateOnCard?: boolean;
  stickyPointerPassThrough?: boolean;
}) => {
  const checkpointId = workEntryAnchorId(entry);
  const pillTowardSpine = entry.lane === "left" ? "end" : "start";
  const cardColClass = stickyPointerPassThrough
    ? "pointer-events-auto relative z-30"
    : undefined;
  const emptyColClass = stickyPointerPassThrough
    ? "pointer-events-none"
    : undefined;

  const nodeColumn = (
    <div
      className={`hidden md:flex md:col-start-2 w-4 h-7 items-center justify-center self-start shrink-0 relative z-10 ${emptyColClass ?? ""}`}
    >
      <WorkTimelineNode checkpointId={checkpointId} />
    </div>
  );

  const rowClass = stickyPointerPassThrough ? "pointer-events-none" : "";

  if (dateOnCard) {
    const cardColumn = (
      <div className={cardColClass}>
        <WorkTimelineDatePill
          entry={entry}
          align={pillTowardSpine}
          className="relative z-20"
        />
        <WorkTimelineItem entry={entry} isOpen={isOpen} />
      </div>
    );

    return (
      <div
        className={`cv-work-checkpoint md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-2 md:items-start w-full ${rowClass}`}
        data-checkpoint-id={checkpointId}
      >
        <div
          className={`md:col-start-1 min-w-0 ${entry.lane === "right" ? emptyColClass : ""}`}
        >
          {entry.lane === "left" ? cardColumn : null}
        </div>
        {nodeColumn}
        <div
          className={`md:col-start-3 min-w-0 ${entry.lane === "left" ? emptyColClass : ""}`}
        >
          {entry.lane === "right" ? cardColumn : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`cv-work-checkpoint md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-2 md:items-start w-full ${rowClass}`}
      data-checkpoint-id={checkpointId}
    >
      <div
        className={`md:col-start-1 min-w-0 ${entry.lane === "right" && stickyPointerPassThrough ? emptyColClass : ""}`}
      >
        {entry.lane === "right" ? (
          <WorkTimelineDatePill
            entry={entry}
            align="end"
            className="relative z-20"
          />
        ) : (
          <WorkTimelineItem
            entry={entry}
            isOpen={isOpen}
            className={cardColClass}
          />
        )}
      </div>
      {nodeColumn}
      <div
        className={`md:col-start-3 min-w-0 ${entry.lane === "left" && stickyPointerPassThrough ? emptyColClass : ""}`}
      >
        {entry.lane === "right" ? (
          <WorkTimelineItem
            entry={entry}
            isOpen={isOpen}
            className={cardColClass}
          />
        ) : (
          <WorkTimelineDatePill
            entry={entry}
            align="start"
            className="relative z-20"
          />
        )}
      </div>
    </div>
  );
};

export const Work = () => {
  const [openValues, setOpenValues] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
  const renderedStickyCompanies = new Set<string>();

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setOpenValues((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    document.addEventListener("cv:open-work-entry", handler);
    return () => document.removeEventListener("cv:open-work-entry", handler);
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!timelineRef.current || !progressRef.current) return;

      const timeline = timelineRef.current;

      gsap.fromTo(
        progressRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timeline,
            start: "top center",
            end: "bottom center",
            scrub: true,
            onUpdate: (self) => syncCheckpointStates(timeline, self.progress),
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".cv-work-item").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      if (!timelineRef.current) return;
      for (const row of timelineRef.current.querySelectorAll(
        ".cv-work-checkpoint",
      )) {
        row.classList.add("cv-checkpoint-reached");
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
        Work Experience
      </h2>

      <div ref={timelineRef} className="relative pl-8 md:pl-0">
        {/* Mobile left spine — behind nodes */}
        <div
          className={`md:hidden absolute left-3 top-0 bottom-0 w-0.5 z-0 ${workSpineTrack}`}
        />

        {/* Center spine — desktop, behind checkpoint nodes */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-0 pointer-events-none">
          <div className={`absolute inset-0 ${workSpineTrack}`} />
          <div
            ref={progressRef}
            className={`absolute inset-0 origin-top ${workSpineFill}`}
            data-testid="work-spine-progress"
          />
        </div>

        <Accordion
          multiple
          value={openValues}
          onValueChange={setOpenValues}
          className="relative z-10 flex flex-col gap-10"
        >
          {items.map((item, i) => {
            if (item.kind === "milestone") {
              return (
                <WorkMilestoneDivider
                  key={`milestone-${item.milestone.year}-${i}`}
                  text={item.milestone.text}
                />
              );
            }

            const { entry } = item;

            if (
              entry.stickyThrough &&
              !renderedStickyCompanies.has(entry.company)
            ) {
              const group = findStickyGroupForEntry(
                entry,
                RESUME.workExperience,
              );
              if (group) {
                renderedStickyCompanies.add(entry.company);
                for (const counterpart of group.counterpartEntries) {
                  renderedStickyCompanies.add(counterpart.company);
                }
                return (
                  <div
                    key={`sticky-${entry.company}`}
                    className="flex flex-col gap-10 w-full pointer-events-none"
                    data-testid="work-sticky-cluster"
                  >
                    <div className="md:sticky md:top-24 w-full z-[5] pointer-events-none">
                      <TimelineEntryRow
                        entry={entry}
                        dateOnCard
                        stickyPointerPassThrough
                        isOpen={openValues.includes(workEntryAnchorId(entry))}
                      />
                    </div>
                    {group.counterpartEntries.map((counterpart) => (
                      <div
                        key={counterpart.company}
                        className="relative z-20 pointer-events-none"
                      >
                        <TimelineEntryRow
                          entry={counterpart}
                          dateOnCard
                          stickyPointerPassThrough
                          isOpen={openValues.includes(
                            workEntryAnchorId(counterpart),
                          )}
                        />
                      </div>
                    ))}
                  </div>
                );
              }
            }

            if (isStickyCounterpart(entry, RESUME.workExperience)) {
              return null;
            }

            return (
              <TimelineEntryRow
                key={`${entry.company}-${entry.startDate}`}
                entry={entry}
                isOpen={openValues.includes(workEntryAnchorId(entry))}
              />
            );
          })}
        </Accordion>
      </div>
    </section>
  );
};
