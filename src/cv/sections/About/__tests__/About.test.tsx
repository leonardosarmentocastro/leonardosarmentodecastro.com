import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { About } from "../About";

describe("About", () => {
  it("renders an About heading", () => {
    renderWithProviders(<About />);
    expect(
      screen.getByRole("heading", { level: 2, name: /^about$/i }),
    ).toBeInTheDocument();
  });

  it("renders every paragraph from RESUME.about", () => {
    renderWithProviders(<About />);
    for (const paragraph of RESUME.about) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("uses Domine foreground for section heading", () => {
    renderWithProviders(<About />);
    expect(
      screen.getByRole("heading", { level: 2, name: /about/i }),
    ).toHaveClass("font-domine", "text-[#2d2a24]");
  });
});
