/** PDF / web CV brand palette */
export const CV_COLORS = {
  accent: "#3c78d8",
  foreground: "#2d2a24",
  muted: "#6c6965",
  mutedAlt: "#6d6964",
  spineTrack: "#c5d9f5",
} as const;

/** Tailwind arbitrary-value helpers (text) */
export const cvTextAccent = "text-[#3c78d8]";
export const cvTextForeground = "text-[#2d2a24]";
export const cvTextMuted = "text-[#6c6965]";
export const cvTextMutedAlt = "text-[#6d6964]";

/** Tailwind arbitrary-value helpers (background / border) */
export const cvBgForeground = "bg-[#2d2a24]";
export const cvBgAccent = "bg-[#3c78d8]";
export const cvBorderAccent = "border-[#3c78d8]";

/** Work timeline — collapsed card */
export const workCardCollapsed = "bg-white border border-neutral-200 shadow-sm";

/** Work timeline — expanded card */
export const workCardExpanded = `${cvBgForeground} border-[#2d2a24] shadow-md`;

export const workMeta = cvTextMuted;
export const workMetaOnDark = cvTextMuted;

export const workTitle = `${cvTextAccent} font-bold uppercase`;
export const workSubtitle = `${cvTextMuted} font-bold`;

export const workBody = `${cvTextMuted} font-normal`;

export const workBadge =
  "bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-100";
export const workBadgeOnDark =
  "bg-neutral-100 text-neutral-900 border-transparent hover:bg-neutral-100";

export const workDatePillDefault =
  "cv-date-pill bg-neutral-200 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors duration-300";

export const workSpineTrack = "bg-[#c5d9f5]";
export const workSpineFill = "bg-[#3c78d8]";
