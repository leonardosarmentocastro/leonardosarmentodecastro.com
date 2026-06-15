"use client";

import { Modal } from "@mantine/core";

import { RESUME } from "@/cv/data";
import type { Skill, WorkExperience } from "@/cv/types";

import { experiencesForSkill } from "./matching";

type Props = {
  skill: Skill | null;
  onClose: () => void;
  onExperienceClick: (entry: WorkExperience) => void;
};

export const SkillExperiencesModal = ({
  skill,
  onClose,
  onExperienceClick,
}: Props) => {
  const matches = skill
    ? experiencesForSkill(skill, RESUME.workExperience)
    : [];

  return (
    <Modal
      opened={skill !== null}
      onClose={onClose}
      centered
      size="auto"
      title={skill ? `Where I used ${skill.name}` : ""}
    >
      {matches.length === 0 ? (
        <p className="text-sm text-neutral-500">No linked experiences yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 min-w-[260px]">
          {matches.map((entry) => (
            <li key={`${entry.company}-${entry.startDate}`}>
              <button
                type="button"
                data-testid={`skill-experience-${entry.company}`}
                onClick={() => onExperienceClick(entry)}
                className="w-full text-left border border-neutral-200 rounded-lg p-3 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
              >
                <span className="block text-sm font-semibold">
                  {entry.company}
                </span>
                <span className="block text-xs text-neutral-500">
                  {entry.role} · {entry.startDate} – {entry.endDate}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
