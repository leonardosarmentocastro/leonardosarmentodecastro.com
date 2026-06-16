"use client";

import { Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useCallback, useState } from "react";

import { trackWorkTechnologySkillClick } from "@/analytics/events";
import { Badge } from "@/components/ui/Badge";
import { workBadge } from "@/cv/cv-colors";
import { RESUME } from "@/cv/data";
import { scrollToSkill } from "@/cv/sections/Skills/anchors";
import { skillForTechnology } from "@/cv/sections/Skills/matching";
import { SkillStars } from "@/cv/sections/Skills/SkillStars";
import { TechIcon } from "@/cv/TechIcon";

type Props = {
  technology: string;
  company: string;
};

export const technologyTestId = (technology: string): string =>
  `work-tech-badge-${technology
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const BadgeContent = ({ technology }: { technology: string }) => (
  <>
    <TechIcon alias={technology} size={14} />
    {technology}
  </>
);

/** Shared visual classes for mapped and unmapped work technology badges */
const badgeClassName = `gap-2 ${workBadge}`;

export const WorkTechnologyBadge = ({ technology, company }: Props) => {
  const skill = skillForTechnology(technology, RESUME.skills);
  const isFinePointer = useMediaQuery(
    "(hover: hover) and (pointer: fine)",
    true,
  );
  const [hintOpen, setHintOpen] = useState(false);

  const navigate = useCallback(() => {
    if (!skill) return;
    scrollToSkill(skill);
    trackWorkTechnologySkillClick({
      technology,
      skill: skill.name,
      company,
    });
    setHintOpen(false);
  }, [skill, technology, company]);

  if (!skill) {
    return (
      <Badge
        variant="secondary"
        className={badgeClassName}
        data-testid={technologyTestId(technology)}
      >
        <BadgeContent technology={technology} />
      </Badge>
    );
  }

  const tooltipLabel = (
    <span className="flex flex-col gap-1 font-quicksand">
      <span className="inline-flex items-center gap-1">
        {skill.level} · <SkillStars count={skill.stars} />
      </span>
      {!isFinePointer && hintOpen && (
        <span className="text-xs text-neutral-400">Tap again to see skill</span>
      )}
    </span>
  );

  const handleClick = () => {
    if (isFinePointer) {
      navigate();
      return;
    }
    if (hintOpen) {
      navigate();
    } else {
      setHintOpen(true);
    }
  };

  return (
    <Tooltip
      label={tooltipLabel}
      position="top"
      withArrow
      multiline
      classNames={{ tooltip: "font-quicksand cv-work-tech-tooltip" }}
      opened={isFinePointer ? undefined : hintOpen}
      events={{ hover: isFinePointer, focus: true, touch: false }}
    >
      <Badge
        render={
          <button
            type="button"
            aria-label={`View ${skill.name} skill — ${skill.level}, ${skill.stars} of 5 stars`}
            onClick={handleClick}
            onBlur={() => {
              if (!isFinePointer) setHintOpen(false);
            }}
          />
        }
        variant="secondary"
        data-testid={technologyTestId(technology)}
        className={`${badgeClassName} cursor-pointer`}
      >
        <BadgeContent technology={technology} />
      </Badge>
    </Tooltip>
  );
};
