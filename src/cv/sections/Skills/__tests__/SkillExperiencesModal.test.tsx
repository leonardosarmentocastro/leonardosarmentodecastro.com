import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";
import type { Skill } from "@/cv/types";
import { renderWithProviders, screen, within } from "@/test/render";

import { experiencesForSkill } from "../matching";
import { SkillExperiencesModal } from "../SkillExperiencesModal";

const javascript = RESUME.skills.find((s) => s.name === "JavaScript") as Skill;

describe("SkillExperiencesModal", () => {
  it("renders nothing open when skill is null", () => {
    renderWithProviders(
      <SkillExperiencesModal
        skill={null}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists each matched experience with company, role and dates", () => {
    renderWithProviders(
      <SkillExperiencesModal
        skill={javascript}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    const matches = experiencesForSkill(javascript, RESUME.workExperience);
    expect(matches.length).toBeGreaterThan(0);
    for (const entry of matches) {
      const row = screen.getByTestId(`skill-experience-${entry.company}`);
      expect(within(row).getByText(entry.company)).toBeInTheDocument();
      expect(
        within(row).getByText(new RegExp(entry.startDate)),
      ).toBeInTheDocument();
    }
  });

  it("calls onExperienceClick with the entry when a row is clicked", async () => {
    const onExperienceClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SkillExperiencesModal
        skill={javascript}
        onClose={vi.fn()}
        onExperienceClick={onExperienceClick}
      />,
    );
    const [first] = experiencesForSkill(javascript, RESUME.workExperience);
    await user.click(screen.getByTestId(`skill-experience-${first.company}`));
    expect(onExperienceClick).toHaveBeenCalledWith(first);
  });

  it("shows an empty state when the skill matches no experiences", () => {
    const orphan: Skill = { ...javascript, name: "Orphan", aliases: [] };
    renderWithProviders(
      <SkillExperiencesModal
        skill={orphan}
        onClose={vi.fn()}
        onExperienceClick={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/no linked experiences yet/i),
    ).toBeInTheDocument();
  });
});
