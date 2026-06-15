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
  workBadgeOnDark,
  workBadgeOnLight,
  workCardCollapsed,
  workCardExpanded,
  workDatePill,
  workMetaOnDark,
} from "./work-colors";

const metadataLine = (entry: WorkExperience): string =>
  [entry.role, entry.via, entry.workMode, entry.location]
    .filter(Boolean)
    .join(" · ");

type Props = {
  entry: WorkExperience;
  isOpen: boolean;
  /** md+: opposite side date pill */
  showSpineDate?: boolean;
};

export const WorkTimelineItem = ({
  entry,
  isOpen,
  showSpineDate = true,
}: Props) => {
  const anchorId = workEntryAnchorId(entry);
  const period = `${entry.startDate} — ${entry.endDate}`;
  const cardClass = isOpen ? workCardExpanded : workCardCollapsed;
  const badgeClass = isOpen ? workBadgeOnDark : workBadgeOnLight;
  const metaClass = isOpen ? workMetaOnDark : "text-[#7B7B7B]";

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      data-lane={entry.lane}
      className="scroll-mt-24 cv-work-item"
    >
      {showSpineDate && (
        <div
          className={`hidden md:flex mb-2 ${
            entry.lane === "left" ? "justify-end pr-4" : "justify-start pl-4"
          }`}
          data-testid={`work-date-pill-${entry.company}`}
        >
          <span className={workDatePill}>{period}</span>
        </div>
      )}

      <Card className={`${cardClass} transition-colors duration-200`}>
        <AccordionItem value={anchorId} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex flex-col items-start gap-1 text-left w-full pr-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 w-full">
                <span className="text-base font-semibold">{entry.company}</span>
                <span className={`text-xs ${metaClass} md:hidden`}>
                  {period}
                </span>
              </div>
              <span className={`text-sm ${metaClass}`}>
                {metadataLine(entry)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className={`text-sm mb-3 ${isOpen ? "text-white/90" : ""}`}>
              {entry.description}
            </p>
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
                  className={`gap-2 ${badgeClass}`}
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
