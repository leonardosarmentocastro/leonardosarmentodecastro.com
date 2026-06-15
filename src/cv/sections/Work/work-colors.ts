export const WORK_COLORS = {
  primary: "#222222",
  secondary: "#7B7B7B",
  tertiary: "#F8F8F8",
  white: "#FFFFFF",
} as const;

/** Collapsed accordion card */
export const workCardCollapsed =
  "bg-white border border-[#7B7B7B]/30 text-[#222222]";

/** Expanded accordion card (dark active) */
export const workCardExpanded = "bg-[#222222] border-[#222222] text-white";

/** Muted metadata on dark background */
export const workMetaOnDark = "text-[#7B7B7B]";

/** Tech badge on dark card */
export const workBadgeOnDark = "bg-[#F8F8F8] text-[#222222] border-transparent";

/** Tech badge on light card */
export const workBadgeOnLight =
  "bg-[#F8F8F8] text-[#222222] border-transparent";

/** Spine track / node inactive */
export const workSpineTrack = "bg-[#7B7B7B]";

/** Spine progress fill */
export const workSpineFill = "bg-[#222222]";

/** Date pill */
export const workDatePill =
  "bg-[#222222] text-white text-xs px-3 py-1 rounded-full whitespace-nowrap";
