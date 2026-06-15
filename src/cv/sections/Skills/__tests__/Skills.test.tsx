import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen, within } from "@/test/render";

import { Skills } from "../Skills";

describe("Skills", () => {
  it("renders a Skills heading", () => {
    renderWithProviders(<Skills />);
    expect(
      screen.getByRole("heading", { level: 2, name: /^skills$/i }),
    ).toBeInTheDocument();
  });

  it("groups skills under each category that appears in the data", () => {
    renderWithProviders(<Skills />);
    const presentCategories = Array.from(
      new Set(RESUME.skills.map((s) => s.category)),
    );
    for (const category of presentCategories) {
      expect(
        screen.getByRole("heading", {
          level: 3,
          name: new RegExp(`^${category}$`, "i"),
        }),
      ).toBeInTheDocument();
    }
  });

  it("renders a card per skill with name, level, years, and area", () => {
    renderWithProviders(<Skills />);
    for (const skill of RESUME.skills) {
      const card = screen.getByTestId(`skill-card-${skill.name}`);
      expect(within(card).getByText(skill.name)).toBeInTheDocument();
      expect(within(card).getByText(skill.level)).toBeInTheDocument();
      expect(within(card).getByText(skill.area)).toBeInTheDocument();
      expect(
        within(card).getByText(new RegExp(`${skill.years}\\s*year`)),
      ).toBeInTheDocument();
    }
  });

  it("renders the dot-fill bar with the right filled/empty counts", () => {
    renderWithProviders(<Skills />);
    for (const skill of RESUME.skills) {
      const card = screen.getByTestId(`skill-card-${skill.name}`);
      const dots = within(card).getByTestId("skill-dots").textContent ?? "";
      const filled = (dots.match(/●/g) ?? []).length;
      const empty = (dots.match(/○/g) ?? []).length;
      expect(filled).toBe(skill.filledDots);
      expect(empty).toBe(skill.totalDots - skill.filledDots);
    }
  });

  it("renders a skill that has matches as a button", () => {
    renderWithProviders(<Skills />);
    expect(screen.getByTestId("skill-card-JavaScript").tagName).toBe("BUTTON");
  });

  it("opens the experiences dialog for the clicked skill", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Skills />);

    await user.click(screen.getByTestId("skill-card-JavaScript"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/where i used javascript/i)).toBeInTheDocument();
  });

  it("renders a tech icon for each skill alias that has a mapping", () => {
    renderWithProviders(<Skills />);
    // "JavaScript" skill has alias "JavaScript" → "js" icon
    const card = screen.getByTestId("skill-card-JavaScript");
    const icons = card.querySelectorAll('span[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]?.innerHTML).toContain("<svg");
  });

  it("renders multiple icons for compound skills with several mapped aliases", () => {
    renderWithProviders(<Skills />);
    // "MongoDB / Redis (NoSQL)" skill has aliases ["MongoDB", "Redis"] — both mapped
    const card = screen.getByTestId("skill-card-MongoDB / Redis (NoSQL)");
    const icons = card.querySelectorAll('span[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });
});
