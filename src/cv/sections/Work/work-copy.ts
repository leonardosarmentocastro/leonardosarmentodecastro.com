import type { WorkExperience } from "@/cv/types";

export const workEntryTitle = (entry: WorkExperience): string => {
  const viaSuffix = entry.via ? ` (${entry.via})` : "";
  return `${entry.role} at "${entry.company}"${viaSuffix}`;
};

export const workEntryMetadata = (entry: WorkExperience): string =>
  `(${entry.workMode}) ${entry.startDate} – ${entry.endDate}`;
