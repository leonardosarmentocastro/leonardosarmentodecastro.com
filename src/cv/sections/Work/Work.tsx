"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

import { Accordion } from "@/components/ui/Accordion";
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
import { WorkTimelineTodayMarker } from "./WorkTimelineTodayMarker";
import { workSpineFill, workSpineTrack } from "./work-colors";

gsap.registerPlugin(ScrollTrigger);

/** Toggle `.cv-checkpoint-reached` on each spine node as scroll progress passes it. */
const syncCheckpointStates = (
  timeline: HTMLElement,
  progress: number,
  onNewlyReached?: (checkpointId: string) => void,
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

    const wasReached = row.classList.contains("cv-checkpoint-reached");
    const reached = fillEdge >= nodeCenterY;
    row.classList.toggle("cv-checkpoint-reached", reached);
    if (!wasReached && reached) {
      const id = row.getAttribute("data-checkpoint-id");
      if (id) onNewlyReached?.(id);
    }
  }
};

/**
 * One timeline row: spine node, date pill(s), and accordion card.
 * Sticky overlap clusters use pointer-events-none on the row so a pinned card
 * does not block clicks on parallel entries at the same scroll position.
 */
const TimelineEntryRow = ({
  entry,
  isOpen,
  showHeaderAnimation = false,
  showBodyAnimation = false,
  /** Overlap cluster: pill above card (same column) to avoid z-fighting */
  dateOnCard = false,
  /** Overlap cluster: limit hit target to the card column only */
  stickyPointerPassThrough = false,
}: {
  entry: WorkExperience;
  isOpen: boolean;
  showHeaderAnimation?: boolean;
  showBodyAnimation?: boolean;
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
  const rowClass = stickyPointerPassThrough ? "pointer-events-none" : "";
  const cardColumnClass = [
    "min-w-0",
    entry.lane === "left" ? "md:col-start-1" : "md:col-start-3",
    cardColClass,
  ]
    .filter(Boolean)
    .join(" ");

  const nodeColumn = (
    <div
      className={`absolute -left-[1.6875rem] top-0 flex h-7 w-4 items-center justify-center z-10 md:static md:col-start-2 md:self-start shrink-0 ${emptyColClass ?? ""}`}
    >
      <WorkTimelineNode checkpointId={checkpointId} />
    </div>
  );

  const cardContent = (
    <>
      {dateOnCard ? (
        <WorkTimelineDatePill
          entry={entry}
          align={pillTowardSpine}
          className="relative z-20"
          placement="shared"
        />
      ) : null}
      <WorkTimelineItem
        entry={entry}
        isOpen={isOpen}
        showHeaderAnimation={showHeaderAnimation}
        showBodyAnimation={showBodyAnimation}
        suppressMobilePeriod
        className={stickyPointerPassThrough ? undefined : cardColClass}
      />
    </>
  );

  return (
    <div
      className={`cv-work-checkpoint relative md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-2 md:items-start w-full ${rowClass}`}
      data-checkpoint-id={checkpointId}
    >
      {nodeColumn}

      {!dateOnCard ? (
        <WorkTimelineDatePill
          entry={entry}
          align="start"
          className="relative z-20 flex md:hidden"
          placement="mobile"
        />
      ) : null}

      {!dateOnCard && entry.lane === "right" ? (
        <div
          className={`hidden md:block md:col-start-1 min-w-0 ${emptyColClass ?? ""}`}
        >
          <WorkTimelineDatePill
            entry={entry}
            align="end"
            className="relative z-20 hidden md:flex"
            placement="desktop"
          />
        </div>
      ) : null}

      {!dateOnCard && entry.lane === "left" ? (
        <div
          className={`hidden md:block md:col-start-3 min-w-0 ${emptyColClass ?? ""}`}
        >
          <WorkTimelineDatePill
            entry={entry}
            align="start"
            className="relative z-20 hidden md:flex"
            placement="desktop"
          />
        </div>
      ) : null}

      {dateOnCard && entry.lane === "left" ? (
        <div
          className={`hidden md:block md:col-start-3 min-w-0 ${emptyColClass ?? ""}`}
        />
      ) : null}

      {dateOnCard && entry.lane === "right" ? (
        <div
          className={`hidden md:block md:col-start-1 min-w-0 ${emptyColClass ?? ""}`}
        />
      ) : null}

      <div className={cardColumnClass}>{cardContent}</div>
    </div>
  );
};

export const Work = () => {
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [activatedAnchorIds, setActivatedAnchorIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const firedPulseRef = useRef<Set<string>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);
  const desktopProgressRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);
  const items = buildTimelineItems(RESUME.workExperience, RESUME.milestones);
  const renderedStickyCompanies = new Set<string>();

  const handleCheckpointReached = useCallback((checkpointId: string) => {
    setActivatedAnchorIds((prev) => {
      if (prev.has(checkpointId)) return prev;
      return new Set(prev).add(checkpointId);
    });
  }, []);

  // Skills modal → scrollToWorkEntry dispatches cv:open-work-entry; expand here.
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setOpenValues((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    document.addEventListener("cv:open-work-entry", handler);
    return () => document.removeEventListener("cv:open-work-entry", handler);
  }, []);

  // Spine fill + card fade-in; reduced-motion users get all checkpoints active.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!timelineRef.current) return;

      const timeline = timelineRef.current;
      const progressEls = [
        desktopProgressRef.current,
        mobileProgressRef.current,
      ].filter((el): el is HTMLDivElement => el !== null);

      if (progressEls.length > 0) {
        gsap.fromTo(
          progressEls,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: timeline,
              start: "top center",
              end: "bottom center",
              scrub: true,
              onUpdate: (self) => {
                syncCheckpointStates(timeline, self.progress, (id) => {
                  handleCheckpointReached(id);
                  if (firedPulseRef.current.has(id)) return;
                  firedPulseRef.current.add(id);
                  const row = timeline.querySelector<HTMLElement>(
                    `[data-checkpoint-id="${id}"]`,
                  );
                  const card =
                    row?.querySelector<HTMLElement>("[data-slot=card]");
                  if (card) {
                    gsap.fromTo(
                      card,
                      { scale: 1 },
                      {
                        scale: 1.03,
                        duration: 0.35,
                        yoyo: true,
                        repeat: 1,
                        ease: "power2.out",
                      },
                    );
                  }
                });
              },
            },
          },
        );
      }

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
      <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
        Work Experience
      </h2>

      <div ref={timelineRef} className="relative pl-8 md:pl-0">
        {/* Mobile left spine — starts at today dot center (h-7 row) */}
        <div className="md:hidden absolute left-3 top-3.5 bottom-0 w-0.5 z-0 pointer-events-none">
          <div className={`absolute inset-0 ${workSpineTrack}`} />
          <div
            ref={mobileProgressRef}
            className={`absolute inset-0 origin-top ${workSpineFill}`}
            data-testid="work-spine-progress-mobile"
          />
        </div>

        {/* Center spine — desktop; starts at today dot center (h-7 row) */}
        <div className="hidden md:block absolute left-1/2 top-3.5 bottom-0 w-0.5 -translate-x-1/2 z-0 pointer-events-none">
          <div className={`absolute inset-0 ${workSpineTrack}`} />
          <div
            ref={desktopProgressRef}
            className={`absolute inset-0 origin-top ${workSpineFill}`}
            data-testid="work-spine-progress"
          />
        </div>

        <WorkTimelineTodayMarker />

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
            const entryAnchorId = workEntryAnchorId(entry);
            const entryActivated = activatedAnchorIds.has(entryAnchorId);
            const entryOpen = openValues.includes(entryAnchorId);

            if (
              entry.stickyThrough &&
              !renderedStickyCompanies.has(entry.company)
            ) {
              // Parallel roles: pin the sticky entry while counterparts scroll past.
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
                        isOpen={entryOpen}
                        showHeaderAnimation={entryActivated}
                        showBodyAnimation={entryActivated && entryOpen}
                      />
                    </div>
                    {group.counterpartEntries.map((counterpart) => {
                      const counterpartAnchorId =
                        workEntryAnchorId(counterpart);
                      const counterpartActivated =
                        activatedAnchorIds.has(counterpartAnchorId);
                      const counterpartOpen =
                        openValues.includes(counterpartAnchorId);
                      return (
                        <div
                          key={counterpart.company}
                          className="relative z-20 pointer-events-none"
                        >
                          <TimelineEntryRow
                            entry={counterpart}
                            dateOnCard
                            stickyPointerPassThrough
                            isOpen={counterpartOpen}
                            showHeaderAnimation={counterpartActivated}
                            showBodyAnimation={
                              counterpartActivated && counterpartOpen
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }

            if (isStickyCounterpart(entry, RESUME.workExperience)) {
              // Rendered inside the sticky cluster above — skip duplicate row.
              return null;
            }

            return (
              <TimelineEntryRow
                key={`${entry.company}-${entry.startDate}`}
                entry={entry}
                isOpen={entryOpen}
                showHeaderAnimation={entryActivated}
                showBodyAnimation={entryActivated && entryOpen}
              />
            );
          })}
        </Accordion>
      </div>
    </section>
  );
};
