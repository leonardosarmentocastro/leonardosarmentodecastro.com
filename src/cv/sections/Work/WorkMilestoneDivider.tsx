"use client";

type Props = { text: string };

/** Visual break between timeline eras — text only, no horizontal rule. */
export const WorkMilestoneDivider = ({ text }: Props) => (
  <div
    className="w-full py-10 md:py-12"
    data-testid="work-milestone"
    role="note"
    aria-label={text}
  >
    <p className="text-center text-sm italic text-neutral-500">{text}</p>
  </div>
);
