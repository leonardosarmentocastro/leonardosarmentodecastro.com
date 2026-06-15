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

const TimelineEntryRow = ({
  entry,
  isOpen,
}: {
  entry: WorkExperience;
  isOpen: boolean;
}) => {
  const checkpointId = workEntryAnchorId(entry);

  return (
    <div
      className="cv-work-checkpoint md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-2 md:items-start"
      data-checkpoint-id={checkpointId}
    >
      <div className="md:col-start-1 min-w-0">
        {entry.lane === "right" ? (
          <WorkTimelineDatePill entry={entry} align="end" />
        ) : (
          <WorkTimelineItem entry={entry} isOpen={isOpen} />
        )}
      </div>
      <div className="hidden md:flex md:col-start-2 w-4 h-7 items-center justify-center self-start shrink-0">
        <WorkTimelineNode checkpointId={checkpointId} />
      </div>
      <div className="md:col-start-3 min-w-0">
        {entry.lane === "right" ? (
          <WorkTimelineItem entry={entry} isOpen={isOpen} />
        ) : (
          <WorkTimelineDatePill entry={entry} align="start" />
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

      gsap.fromTo(
        progressRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top center",
            end: "bottom center",
            scrub: true,
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

      gsap.utils.toArray<HTMLElement>(".cv-work-checkpoint").forEach((row) => {
        ScrollTrigger.create({
          trigger: row,
          start: "top 58%",
          onEnter: () => row.classList.add("cv-checkpoint-reached"),
          onLeaveBack: () => row.classList.remove("cv-checkpoint-reached"),
        });
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.utils.toArray<HTMLElement>(".cv-work-checkpoint").forEach((row) => {
        row.classList.add("cv-checkpoint-reached");
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
        Work Experience
      </h2>

      <div ref={timelineRef} className="relative pl-8 md:pl-0">
        {/* Mobile left spine */}
        <div
          className={`md:hidden absolute left-3 top-0 bottom-0 w-0.5 ${workSpineTrack}`}
        />

        {/* Center spine — desktop */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
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
          className="flex flex-col gap-10"
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
                    className="flex flex-col gap-10"
                    data-testid="work-sticky-cluster"
                  >
                    <div className="md:sticky md:top-24 md:self-start">
                      <TimelineEntryRow
                        entry={entry}
                        isOpen={openValues.includes(workEntryAnchorId(entry))}
                      />
                    </div>
                    {group.counterpartEntries.map((counterpart) => (
                      <TimelineEntryRow
                        key={counterpart.company}
                        entry={counterpart}
                        isOpen={openValues.includes(
                          workEntryAnchorId(counterpart),
                        )}
                      />
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
