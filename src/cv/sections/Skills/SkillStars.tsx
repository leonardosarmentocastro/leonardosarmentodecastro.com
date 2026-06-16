import { IconStar, IconStarFilled } from "@tabler/icons-react";

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

type Props = {
  count: number;
};

export const SkillStars = ({ count }: Props) => (
  <span
    role="img"
    aria-label={`${count} of 5 stars`}
    className="inline-flex items-center"
  >
    {STAR_POSITIONS.map((pos) =>
      pos <= count ? (
        <IconStarFilled key={pos} className="w-3 h-3 text-amber-500" />
      ) : (
        <IconStar key={pos} className="w-3 h-3 text-neutral-300" />
      ),
    )}
  </span>
);
