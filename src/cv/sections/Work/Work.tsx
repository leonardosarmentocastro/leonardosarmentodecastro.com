"use client";

import { Accordion, Badge, Timeline } from "@mantine/core";
import { useEffect, useState } from "react";

import { RESUME } from "@/cv/data";
import { TechIcon } from "@/cv/TechIcon";
import type { Milestone, WorkExperience } from "@/cv/types";

import { workEntryAnchorId } from "./anchors";
import { CompanyLogo } from "./CompanyLogo";

const parseStartYear = (startDate: string): number => {
  const match = startDate.match(/\d{4}/);
  if (!match) throw new Error(`Cannot parse year from startDate: ${startDate}`);
  return Number(match[0]);
};

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
  const remaining = [...milestones];

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

const MilestoneDot = () => (
  <div className="w-2 h-2 rounded-full bg-neutral-300" />
);

type WorkEntryProps = {
  entry: WorkExperience;
  openValue: string | null;
  setOpenValue: (val: string | null) => void;
};

const WorkEntry = ({ entry, openValue, setOpenValue }: WorkEntryProps) => {
  const anchorId = workEntryAnchorId(entry);

  return (
    <div
      id={anchorId}
      data-testid={`work-entry-${entry.company}`}
      className="scroll-mt-24"
    >
      <Accordion
        value={openValue === anchorId ? anchorId : null}
        onChange={setOpenValue}
        classNames={{ control: "hover:!bg-neutral-100" }}
      >
        <Accordion.Item value={anchorId}>
          <Accordion.Control>
            <div className="flex flex-row justify-between items-baseline gap-4 flex-wrap pr-3">
              <span className="text-base font-semibold">{entry.company}</span>
              <span className="text-xs text-neutral-500 whitespace-nowrap">
                {entry.startDate} — {entry.endDate}
              </span>
            </div>
            <p className="text-sm text-neutral-700 mt-1">
              {entry.role}
              {entry.via ? (
                <span className="text-neutral-500"> · {entry.via}</span>
              ) : null}
              <span className="text-neutral-500"> · {entry.workMode}</span>
              {entry.location ? (
                <span className="text-neutral-500"> · {entry.location}</span>
              ) : null}
            </p>
          </Accordion.Control>
          <Accordion.Panel>
            <p className="text-sm text-neutral-600">{entry.description}</p>
            <ul className="list-disc list-outside ml-5 text-sm text-neutral-700 space-y-1 mt-2">
              {entry.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="text-xs text-neutral-600 mt-3">
              <span className="font-semibold">Technologies: </span>
              <br className="mb-2" />
              <span className="inline-flex flex-wrap gap-2 align-middle">
                {entry.technologies.map((t) => (
                  <Badge
                    key={t}
                    size="md"
                    color="gray"
                    variant="light"
                    className="!p-3"
                  >
                    <span className="inline-flex items-center gap-2">
                      <TechIcon alias={t} size={14} />
                      {t}
                    </span>
                  </Badge>
                ))}
              </span>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export const Work = () => {
  const [openValue, setOpenValue] = useState<string | null>(null);
  const items = interleave(RESUME.workExperience, RESUME.milestones);

  useEffect(() => {
    const handler = (e: Event) => {
      setOpenValue((e as CustomEvent<string>).detail);
    };
    document.addEventListener("cv:open-work-entry", handler);
    return () => document.removeEventListener("cv:open-work-entry", handler);
  }, []);

  return (
    <section id="work" className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold tracking-tight">Work Experience</h2>
      <Timeline bulletSize={48} lineWidth={3}>
        {items.map((item, i) =>
          item.kind === "work" ? (
            <Timeline.Item
              key={`${item.entry.company}-${item.entry.startDate}`}
              bullet={<CompanyLogo company={item.entry.company} />}
            >
              <WorkEntry
                entry={item.entry}
                openValue={openValue}
                setOpenValue={setOpenValue}
              />
            </Timeline.Item>
          ) : (
            <Timeline.Item
              key={`${item.milestone.year}-${i}`}
              bullet={<MilestoneDot />}
            >
              <p className="text-xs italic text-neutral-400">
                {item.milestone.text}
              </p>
            </Timeline.Item>
          ),
        )}
      </Timeline>
    </section>
  );
};
