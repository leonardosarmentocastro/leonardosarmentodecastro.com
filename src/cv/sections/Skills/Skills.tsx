"use client";

import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { useState } from "react";

import {
  trackSkillExperienceClick,
  trackSkillExperiencesOpen,
} from "@/analytics/events";
import { RESUME } from "@/cv/data";
import { getUniqueIconAliases } from "@/cv/icons";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import { TechIcon } from "@/cv/TechIcon";
import type { Skill, SkillCategory, WorkExperience } from "@/cv/types";

import { experiencesForSkill } from "./matching";
import { SkillExperiencesModal } from "./SkillExperiencesModal";

const CATEGORY_ORDER: ReadonlyArray<SkillCategory> = [
  "Language",
  "Framework",
  "Runtime",
  "Database",
  "Infrastructure",
  "CMS",
  "AI",
  "Design",
];

const groupByCategory = (
  skills: ReadonlyArray<Skill>,
): Array<{ category: SkillCategory; items: Skill[] }> => {
  const buckets = new Map<SkillCategory, Skill[]>();
  for (const skill of skills) {
    const existing = buckets.get(skill.category);
    if (existing) existing.push(skill);
    else buckets.set(skill.category, [skill]);
  }
  return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((category) => ({
    category,
    items: buckets.get(category) ?? [],
  }));
};

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;

const Stars = ({ count }: { count: number }) => (
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

const Dots = ({ filled, total }: { filled: number; total: number }) => {
  const text = "●".repeat(filled) + "○".repeat(total - filled);
  return (
    <span
      data-testid="skill-dots"
      className="font-mono text-neutral-400 text-xs"
    >
      {text}
    </span>
  );
};

/** Card body, built only from phrasing content so it is valid inside a button. */
const SkillCardInner = ({ skill }: { skill: Skill }) => {
  const iconAliases = getUniqueIconAliases(skill.aliases);
  return (
    <>
      {iconAliases.length > 0 && (
        <span className="flex flex-row items-center gap-1.5">
          {iconAliases.map((alias) => (
            <TechIcon key={alias} alias={alias} size={18} />
          ))}
        </span>
      )}
      <span className="flex flex-row justify-between items-baseline gap-2">
        <span className="text-sm font-semibold text-[#2d2a24]">
          {skill.name}
        </span>
        <span className="flex flex-row items-center gap-1">
          <span className="text-xs text-neutral-500">{skill.level}</span>
          <Stars count={skill.stars} />
        </span>
      </span>
      <span className="block text-xs text-neutral-500">{skill.area}</span>
      <span className="block text-xs text-neutral-500">
        {skill.years} years · {skill.since}
      </span>
      <Dots filled={skill.filledDots} total={skill.totalDots} />
    </>
  );
};

const CARD_CLASS =
  "border border-neutral-200 rounded-lg p-4 flex flex-col gap-1";

const SkillCard = ({
  skill,
  onOpen,
}: {
  skill: Skill;
  onOpen: (skill: Skill) => void;
}) => {
  const interactive =
    experiencesForSkill(skill, RESUME.workExperience).length > 0;

  if (!interactive) {
    return (
      <div data-testid={`skill-card-${skill.name}`} className={CARD_CLASS}>
        <SkillCardInner skill={skill} />
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={`skill-card-${skill.name}`}
      aria-haspopup="dialog"
      onClick={() => onOpen(skill)}
      className={`${CARD_CLASS} text-left w-full cursor-pointer hover:border-neutral-400 hover:shadow-sm transition`}
    >
      <SkillCardInner skill={skill} />
    </button>
  );
};

export const Skills = () => {
  const groups = groupByCategory(RESUME.skills);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const handleOpen = (skill: Skill) => {
    setActiveSkill(skill);
    trackSkillExperiencesOpen({ skill: skill.name });
  };

  const handleExperienceClick = (entry: WorkExperience) => {
    if (activeSkill) {
      trackSkillExperienceClick({
        skill: activeSkill.name,
        company: entry.company,
      });
    }
    setActiveSkill(null);
    scrollToWorkEntry(entry);
  };

  return (
    <section id="skills" className="flex flex-col gap-6">
      <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
        Skills
      </h2>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((skill) => (
              <SkillCard key={skill.name} skill={skill} onOpen={handleOpen} />
            ))}
          </div>
        </div>
      ))}
      <SkillExperiencesModal
        skill={activeSkill}
        onClose={() => setActiveSkill(null)}
        onExperienceClick={handleExperienceClick}
      />
    </section>
  );
};
