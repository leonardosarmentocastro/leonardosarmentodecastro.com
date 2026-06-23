"use client";

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

import { skillAnchorId } from "./anchors";
import { experiencesForSkill } from "./matching";
import { SkillExperiencesModal } from "./SkillExperiencesModal";
import { SkillStars } from "./SkillStars";

const CATEGORY_ORDER: ReadonlyArray<SkillCategory> = [
  "Communication",
  "AI",
  "Runtimes",
  "Languages",
  "Frameworks",
  "Databases",
  "Infrastructure",
  "CMS",
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

const Dots = ({ filled, total }: { filled: number; total: number }) => {
  const text = "●".repeat(filled) + "○".repeat(total - filled);
  return (
    <span
      data-testid="skill-dots"
      className="font-quicksand text-neutral-400 text-xs"
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
      {(skill.emoji ?? iconAliases.length > 0) && (
        <span className="flex flex-row items-center gap-1.5">
          {skill.emoji && (
            <span aria-hidden="true" className="text-lg leading-none">
              {skill.emoji}
            </span>
          )}
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
          <SkillStars count={skill.stars} />
        </span>
      </span>
      <span className="block text-xs text-neutral-500">{skill.area}</span>
      {skill.omitExperienceBar ? (
        <span className="block text-xs text-neutral-500">{skill.since}</span>
      ) : (
        <>
          <span className="block text-xs text-neutral-500">
            {skill.years} years · {skill.since}
          </span>
          <Dots filled={skill.filledDots} total={skill.totalDots} />
        </>
      )}
    </>
  );
};

const CARD_CLASS =
  "cv-print-skill-card font-quicksand border border-neutral-200 rounded-lg p-4 flex flex-col gap-1 scroll-mt-24";

const SkillCard = ({
  skill,
  onOpen,
  printMode = false,
}: {
  skill: Skill;
  onOpen: (skill: Skill) => void;
  printMode?: boolean;
}) => {
  const interactive =
    !printMode && experiencesForSkill(skill, RESUME.workExperience).length > 0;

  if (!interactive) {
    return (
      <div
        id={skillAnchorId(skill)}
        data-testid={`skill-card-${skill.name}`}
        className={CARD_CLASS}
      >
        <SkillCardInner skill={skill} />
      </div>
    );
  }

  return (
    <button
      type="button"
      id={skillAnchorId(skill)}
      data-testid={`skill-card-${skill.name}`}
      aria-haspopup="dialog"
      onClick={() => onOpen(skill)}
      className={`${CARD_CLASS} text-left w-full cursor-pointer hover:border-neutral-400 hover:shadow-sm transition`}
    >
      <SkillCardInner skill={skill} />
    </button>
  );
};

export const Skills = ({ printMode = false }: { printMode?: boolean }) => {
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
    <section id="skills" className="flex flex-col gap-6 font-quicksand">
      <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
        Skills
      </h2>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-xs font-quicksand font-bold uppercase tracking-wider text-neutral-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
                onOpen={handleOpen}
                printMode={printMode}
              />
            ))}
          </div>
        </div>
      ))}
      {!printMode && (
        <SkillExperiencesModal
          skill={activeSkill}
          onClose={() => setActiveSkill(null)}
          onExperienceClick={handleExperienceClick}
        />
      )}
    </section>
  );
};
