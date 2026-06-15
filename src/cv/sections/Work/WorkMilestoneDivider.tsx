"use client";

type Props = { text: string };

/** Visual break between timeline eras — white mask hides the spine behind text */
export const WorkMilestoneDivider = ({ text }: Props) => (
  <div
    className="relative z-10 w-full py-10 md:py-12 bg-white"
    data-testid="work-milestone"
    role="note"
    aria-label={text}
  >
    <p className="text-center text-sm italic text-neutral-500 px-6">{text}</p>
  </div>
);
