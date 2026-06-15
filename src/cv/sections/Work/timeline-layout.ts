import type { Milestone, WorkExperience } from "@/cv/types";

const MONTHS: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Month + year label for the timeline origin dot (matches work entry date style). */
export const formatTodayTimelineDate = (date: Date = new Date()): string =>
  `${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;

export type ParsedDate = { year: number; month: number };

export type TimelineItem =
  | { kind: "work"; entry: WorkExperience }
  | { kind: "milestone"; milestone: Milestone };

export type StickyGroup = {
  stickyEntry: WorkExperience;
  throughEntry: WorkExperience;
  counterpartEntries: WorkExperience[];
};

export const parseWorkDate = (value: string): ParsedDate => {
  if (value === "Present") {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const match = value.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) throw new Error(`Cannot parse date: ${value}`);
  const month = MONTHS[match[1]];
  if (!month) throw new Error(`Unknown month: ${match[1]}`);
  return { year: Number(match[2]), month };
};

const toSortKey = (d: ParsedDate): number => d.year * 12 + d.month;

const rangeFor = (
  entry: WorkExperience,
): { start: ParsedDate; end: ParsedDate } => ({
  start: parseWorkDate(entry.startDate),
  end: parseWorkDate(entry.endDate),
});

export const datesOverlap = (a: WorkExperience, b: WorkExperience): boolean => {
  const ra = rangeFor(a);
  const rb = rangeFor(b);
  return (
    toSortKey(ra.start) <= toSortKey(rb.end) &&
    toSortKey(rb.start) <= toSortKey(ra.end)
  );
};

const parseStartYear = (startDate: string): number =>
  parseWorkDate(startDate).year;

export const buildTimelineItems = (
  entries: ReadonlyArray<WorkExperience>,
  milestones: ReadonlyArray<Milestone>,
): TimelineItem[] => {
  const result: TimelineItem[] = [];
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

export const findStickyGroupForEntry = (
  entry: WorkExperience,
  allEntries: ReadonlyArray<WorkExperience>,
): StickyGroup | null => {
  if (!entry.stickyThrough) return null;

  const throughEntry = allEntries.find(
    (e) => e.company === entry.stickyThrough,
  );
  if (!throughEntry) {
    throw new Error(
      `stickyThrough "${entry.stickyThrough}" not found for ${entry.company}`,
    );
  }

  const throughIdx = allEntries.indexOf(throughEntry);
  const stickyIdx = allEntries.indexOf(entry);
  const slice = allEntries.slice(
    Math.min(stickyIdx, throughIdx),
    Math.max(stickyIdx, throughIdx) + 1,
  );

  const counterpartEntries = slice.filter(
    (e) => e.company !== entry.company && datesOverlap(entry, e),
  );

  return { stickyEntry: entry, throughEntry, counterpartEntries };
};

/** True when this entry is a counterpart inside another entry's sticky group */
export const isStickyCounterpart = (
  entry: WorkExperience,
  allEntries: ReadonlyArray<WorkExperience>,
): boolean =>
  allEntries.some(
    (candidate) =>
      candidate.stickyThrough &&
      candidate.company !== entry.company &&
      findStickyGroupForEntry(candidate, allEntries)?.counterpartEntries.some(
        (c) => c.company === entry.company,
      ),
  );
