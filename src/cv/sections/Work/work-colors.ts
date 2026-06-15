/** Shadcn timeline template palette (neutral / light). */
export const WORK_COLORS = {
  foreground: "#171717",
  muted: "#737373",
  border: "#e5e5e5",
  card: "#ffffff",
  pillPrimary: "#171717",
  pillSecondary: "#e5e5e5",
  spineTrack: "#d4d4d4",
  spineFill: "#171717",
  node: "#a3a3a3",
} as const;

/** Collapsed accordion card */
export const workCardCollapsed =
  "bg-white border border-neutral-200 text-neutral-900 shadow-sm";

/** Expanded accordion card — full dark active theme */
export const workCardExpanded =
  "bg-neutral-900 border-neutral-900 text-white shadow-md";

/** Muted metadata on light card */
export const workMeta = "text-neutral-500";

/** Muted metadata on dark card */
export const workMetaOnDark = "text-neutral-400";

/** Tech badge on light card */
export const workBadge =
  "bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-100";

/** Tech badge on dark card */
export const workBadgeOnDark =
  "bg-neutral-800 text-neutral-100 border-transparent hover:bg-neutral-800";

/** Date pill — default (scroll not yet reached) */
export const workDatePillDefault =
  "cv-date-pill bg-neutral-200 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors duration-300";

/** Spine track / node inactive */
export const workSpineTrack = "bg-neutral-300";

/** Spine progress fill */
export const workSpineFill = "bg-neutral-900";
