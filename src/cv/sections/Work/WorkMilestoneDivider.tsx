"use client";

type Props = { text: string };

export const WorkMilestoneDivider = ({ text }: Props) => (
  <div className="w-full py-6" data-testid="work-milestone">
    <p className="text-center text-xs italic text-[#7B7B7B] mb-3">{text}</p>
    <hr className="border-[#7B7B7B]" />
  </div>
);
