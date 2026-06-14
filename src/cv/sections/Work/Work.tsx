"use client";

import { Badge } from "@mantine/core";

import { RESUME } from "@/cv/data";
import type { Milestone, WorkExperience } from "@/cv/types";

const parseStartYear = (startDate: string): number => {
  const match = startDate.match(/\d{4}/);
  if (!match) throw new Error(`Cannot parse year from startDate: ${startDate}`);
  return Number(match[0]);
};

/**
 * Walk most-recent-first work entries, interleaving milestones in
 * chronological order. A milestone slots BEFORE the first work entry
 * whose start year is <= the milestone's year.
 */
const interleave = (
  entries: ReadonlyArray<WorkExperience>,
  milestones: ReadonlyArray<Milestone>,
): Array<
  | { kind: "work"; entry: WorkExperience }
  | { kind: "milestone"; milestone: Milestone }
> => {
  const result: Array<
    | { kind: "work"; entry: WorkExperience }
    | { kind: "milestone"; milestone: Milestone }
  > = [];
  const remaining = [...milestones]; // already sorted most-recent-first

  for (const entry of entries) {
    const startYear = parseStartYear(entry.startDate);
    while (remaining.length > 0 && remaining[0].year > startYear) {
      const next = remaining.shift();
      if (next) result.push({ kind: "milestone", milestone: next });
    }
    result.push({ kind: "work", entry });
  }

  for (const milestone of remaining) {
    result.push({ kind: "milestone", milestone });
  }

  return result;
};

const WorkEntry = ({ entry }: { entry: WorkExperience }) => (
  <article
    data-testid={`work-entry-${entry.company}`}
    className="flex flex-col gap-2"
  >
    <header className="flex flex-row justify-between items-baseline gap-4">
      <h3 className="text-base font-semibold">{entry.company}</h3>
      <span className="text-xs text-neutral-500 whitespace-nowrap">
        {entry.startDate} — {entry.endDate}
      </span>
    </header>
    <p className="text-sm text-neutral-700">
      {entry.role}
      {entry.via ? (
        <span className="text-neutral-500"> · {entry.via}</span>
      ) : null}
      <span className="text-neutral-500"> · {entry.workMode}</span>
      {entry.location ? (
        <span className="text-neutral-500"> · {entry.location}</span>
      ) : null}
    </p>
    <p className="text-sm text-neutral-600">{entry.description}</p>
    <ul className="list-disc list-outside ml-5 text-sm text-neutral-700 space-y-1">
      {entry.bullets.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
    <p className="text-xs text-neutral-600 mt-1">
      <span className="font-semibold">Technologies: </span>
      <span className="inline-flex flex-wrap gap-1 align-middle">
        {entry.technologies.map((t) => (
          <Badge key={t} size="sm" color="gray" variant="light">
            {t}
          </Badge>
        ))}
      </span>
    </p>
  </article>
);

const MilestoneRow = ({ milestone }: { milestone: Milestone }) => (
  <p className="text-xs italic text-neutral-500 my-2">{milestone.text}</p>
);

export const Work = () => {
  const items = interleave(RESUME.workExperience, RESUME.milestones);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight">Work Experience</h2>
      <div className="flex flex-col gap-8">
        {items.map((item, i) =>
          item.kind === "work" ? (
            <WorkEntry
              key={`${item.entry.company}-${item.entry.startDate}`}
              entry={item.entry}
            />
          ) : (
            <MilestoneRow
              key={`${item.milestone.year}-${i}`}
              milestone={item.milestone}
            />
          ),
        )}
      </div>
    </section>
  );
};
