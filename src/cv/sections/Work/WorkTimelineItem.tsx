"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TextAnimate } from "@/components/ui/text-animate";
import { TechIcon } from "@/cv/TechIcon";
import type { WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import { CompanyLogo } from "./CompanyLogo";
import {
  workBadge,
  workBody,
  workCardCollapsed,
  workCardExpanded,
  workDatePillDefault,
  workSubtitle,
  workTitle,
} from "./work-colors";
import { workEntryMetadata, workEntryTitle } from "./work-copy";

const AnimatedLine = ({
  animate,
  animation,
  by,
  className,
  children,
}: {
  animate: boolean;
  animation: "blurInUp" | "fadeIn";
  by: "word" | "line";
  className?: string;
  children: string;
}) =>
  animate ? (
    <TextAnimate
      animation={animation}
      by={by}
      once
      startOnView={false}
      className={className}
    >
      {children}
    </TextAnimate>
  ) : (
    <span className={className}>{children}</span>
  );

type DatePillProps = {
  entry: WorkExperience;
  /** Pill flush toward the center spine */
  align: "start" | "end";
  className?: string;
  /** Distinguishes mobile vs desktop pills when both exist in the DOM. */
  placement?: "mobile" | "desktop" | "shared";
};

/** Date pill beside the spine (desktop opposite) or above the card (mobile). */
export const WorkTimelineDatePill = ({
  entry,
  align,
  className = "",
  placement = "shared",
}: DatePillProps) => {
  const period = `${entry.startDate} — ${entry.endDate}`;
  const testId =
    placement === "mobile"
      ? `work-date-pill-mobile-${entry.company}`
      : placement === "desktop"
        ? `work-date-pill-desktop-${entry.company}`
        : `work-date-pill-${entry.company}`;

  return (
    <div
      className={`mb-2 flex h-7 items-center ${
        align === "end" ? "justify-end" : "justify-start"
      } ${className}`}
      data-testid={testId}
    >
      <span className={workDatePillDefault}>{period}</span>
    </div>
  );
};

type Props = {
  entry: WorkExperience;
  isOpen: boolean;
  showHeaderAnimation?: boolean;
  showBodyAnimation?: boolean;
  /** When true, pill renders above the card (sticky cluster fallback). */
  showInlineDate?: boolean;
  /** Hide inline period in header when a pill is shown above the card on mobile. */
  suppressMobilePeriod?: boolean;
  className?: string;
};

export const WorkTimelineItem = ({
  entry,
  isOpen,
  showHeaderAnimation = false,
  showBodyAnimation = false,
  showInlineDate = false,
  suppressMobilePeriod = false,
  className = "",
}: Props) => {
  const anchorId = workEntryAnchorId(entry);
  const cardClass = isOpen ? workCardExpanded : workCardCollapsed;
  const triggerLabel = `Toggle ${entry.company} work experience details`;
  const metadata = workEntryMetadata(entry);
  const title = workEntryTitle(entry);
  const titleClass = `text-sm font-quicksand ${workTitle}`;
  const subtitleClass = `text-xs font-quicksand ${workSubtitle}`;
  const bodyClass = `font-quicksand ${workBody}`;

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      data-lane={entry.lane}
      data-header-animated={showHeaderAnimation ? "true" : undefined}
      className={`scroll-mt-24 cv-work-item ${className}`}
    >
      {showInlineDate && (
        <WorkTimelineDatePill
          entry={entry}
          align={entry.lane === "left" ? "start" : "end"}
          className="mb-2"
        />
      )}

      <Card className={`${cardClass} transition-colors duration-200`}>
        <AccordionItem value={anchorId} className="border-none">
          <AccordionTrigger
            aria-label={triggerLabel}
            className="cursor-pointer px-4 py-3 hover:no-underline focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl [&[data-state=open]>svg]:rotate-180 hover:bg-neutral-50/80 focus-visible:ring-[#3c78d8] text-neutral-900 [&_svg]:text-[#6c6965]"
          >
            <div className="flex items-start gap-3 text-left w-full pr-2">
              <CompanyLogo company={entry.company} />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <AnimatedLine
                  animate={showHeaderAnimation}
                  animation="blurInUp"
                  by="word"
                  className={titleClass}
                >
                  {title}
                </AnimatedLine>
                <AnimatedLine
                  animate={showHeaderAnimation}
                  animation="blurInUp"
                  by="word"
                  className={subtitleClass}
                >
                  {metadata}
                </AnimatedLine>
                {!suppressMobilePeriod && (
                  <AnimatedLine
                    animate={showHeaderAnimation}
                    animation="blurInUp"
                    by="word"
                    className={`${subtitleClass} md:hidden`}
                  >
                    {metadata}
                  </AnimatedLine>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AnimatedLine
              animate={showBodyAnimation}
              animation="fadeIn"
              by="line"
              className={`text-sm mb-3 ${bodyClass}`}
            >
              {entry.description}
            </AnimatedLine>
            <ul
              className={`list-disc list-outside ml-5 text-sm space-y-1 mb-4 ${bodyClass}`}
            >
              {entry.bullets.map((b) => (
                <li key={b}>
                  <AnimatedLine
                    animate={showBodyAnimation}
                    animation="fadeIn"
                    by="line"
                    className={bodyClass}
                  >
                    {b}
                  </AnimatedLine>
                </li>
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
