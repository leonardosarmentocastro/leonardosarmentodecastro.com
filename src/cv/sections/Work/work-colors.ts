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

/** Expanded accordion card — stays light, emphasized border */
export const workCardExpanded =
  "bg-white border border-neutral-900 text-neutral-900 shadow-md";

/** Muted metadata */
export const workMeta = "text-neutral-500";

/** Tech badge */
export const workBadge =
  "bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-100";

/** Date pill — primary (black) */
export const workDatePillPrimary =
  "bg-neutral-900 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap";

/** Date pill — secondary (gray) */
export const workDatePillSecondary =
  "bg-neutral-200 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap";

/** Spine track / node inactive */
export const workSpineTrack = "bg-neutral-300";

/** Spine progress fill */
export const workSpineFill = "bg-neutral-900";

/** Timeline node dot */
export const workSpineNode = "bg-neutral-400";
