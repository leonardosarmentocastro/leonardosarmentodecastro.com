"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TechIcon } from "@/cv/TechIcon";
import type { WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import {
  workBadge,
  workCardCollapsed,
  workCardExpanded,
  workDatePillPrimary,
  workDatePillSecondary,
  workMeta,
} from "./work-colors";

const metadataLine = (entry: WorkExperience): string =>
  [entry.role, entry.via, entry.workMode, entry.location]
    .filter(Boolean)
    .join(" · ");

type DatePillProps = {
  entry: WorkExperience;
  /** Pill flush toward the center spine */
  align: "start" | "end";
  className?: string;
};

/** Date pill on the opposite side of the spine from the card (desktop). */
export const WorkTimelineDatePill = ({
  entry,
  align,
  className = "",
}: DatePillProps) => {
  const period = `${entry.startDate} — ${entry.endDate}`;
  const pillClass =
    entry.lane === "right" ? workDatePillPrimary : workDatePillSecondary;

  return (
    <div
      className={`hidden md:flex mb-2 ${
        align === "end" ? "justify-end" : "justify-start"
      } ${className}`}
      data-testid={`work-date-pill-${entry.company}`}
    >
      <span className={pillClass}>{period}</span>
    </div>
  );
};

type Props = {
  entry: WorkExperience;
  isOpen: boolean;
  /** When true, pill renders above the card (sticky cluster fallback). */
  showInlineDate?: boolean;
};

export const WorkTimelineItem = ({
  entry,
  isOpen,
  showInlineDate = false,
}: Props) => {
  const anchorId = workEntryAnchorId(entry);
  const period = `${entry.startDate} — ${entry.endDate}`;
  const cardClass = isOpen ? workCardExpanded : workCardCollapsed;
  const triggerLabel = `Toggle ${entry.company} work experience details`;

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      data-lane={entry.lane}
      className="scroll-mt-24 cv-work-item"
    >
      {showInlineDate && (
        <WorkTimelineDatePill
          entry={entry}
          align={entry.lane === "left" ? "start" : "end"}
          className="md:flex"
        />
      )}

      <Card className={`${cardClass} transition-shadow duration-200`}>
        <AccordionItem value={anchorId} className="border-none">
          <AccordionTrigger
            aria-label={triggerLabel}
            className="cursor-pointer px-4 py-3 hover:no-underline hover:bg-neutral-50/80 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-xl [&[data-state=open]>svg]:rotate-180"
          >
            <div className="flex flex-col items-start gap-1 text-left w-full pr-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 w-full">
                <span className="text-base font-semibold text-neutral-900">
                  {entry.company}
                </span>
                <span className={`text-xs ${workMeta} md:hidden`}>
                  {period}
                </span>
              </div>
              <span className={`text-sm ${workMeta}`}>
                {metadataLine(entry)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-neutral-600">
            <p className="text-sm mb-3">{entry.description}</p>
            <ul className="list-disc list-outside ml-5 text-sm space-y-1 mb-4">
              {entry.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {entry.technologies.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className={`gap-2 ${workBadge}`}
                >
                  <TechIcon alias={t} size={14} />
                  {t}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Card>
    </div>
  );
};
