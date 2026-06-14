"use client";

import { IconStar, IconStarFilled } from "@tabler/icons-react";

import { RESUME } from "@/cv/data";
import type { Skill, SkillCategory } from "@/cv/types";

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

const SkillCard = ({ skill }: { skill: Skill }) => (
  <div
    data-testid={`skill-card-${skill.name}`}
    className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-1"
  >
    <header className="flex flex-row justify-between items-baseline gap-2">
      <span className="text-sm font-semibold">{skill.name}</span>
      <span className="flex flex-row items-center gap-1">
        <span className="text-xs text-neutral-500">{skill.level}</span>
        <Stars count={skill.stars} />
      </span>
    </header>
    <p className="text-xs text-neutral-500">{skill.area}</p>
    <p className="text-xs text-neutral-500">
      {skill.years} years · {skill.since}
    </p>
    <Dots filled={skill.filledDots} total={skill.totalDots} />
  </div>
);

export const Skills = () => {
  const groups = groupByCategory(RESUME.skills);

  return (
    <section id="skills" className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
