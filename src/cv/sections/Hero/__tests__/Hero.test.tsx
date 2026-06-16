import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen } from "@/test/render";

import { Hero } from "../Hero";

describe("Hero", () => {
  it("renders the name as the section heading", () => {
    renderWithProviders(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1, name: RESUME.hero.name }),
    ).toBeInTheDocument();
  });

  it("renders the role, kicker, location, and blurb", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByText(RESUME.hero.role)).toBeInTheDocument();
    expect(screen.getByText(RESUME.hero.kicker)).toBeInTheDocument();
    expect(screen.getByText(RESUME.hero.location)).toBeInTheDocument();
    expect(screen.getByText(RESUME.hero.blurb)).toBeInTheDocument();
  });

  it("renders the avatar with an alt text including the name", () => {
    renderWithProviders(<Hero />);
    const avatar = screen.getByRole("img", {
      name: new RegExp(RESUME.hero.name, "i"),
    });
    expect(avatar).toHaveAttribute("src", RESUME.hero.avatar);
  });

  it("renders the four hero quick-links (LinkedIn, Email, WhatsApp, Site)", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.linkedin,
    );
    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      `mailto:${RESUME.hero.links.email}`,
    );
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.whatsapp,
    );
    expect(
      screen.getByRole("link", { name: /personal site/i }),
    ).toHaveAttribute("href", RESUME.hero.links.site);
  });

  it("styles kicker and role in uppercase Spectral blue", () => {
    renderWithProviders(<Hero />);
    const kicker = screen.getByText(RESUME.hero.kicker);
    const role = screen.getByText(RESUME.hero.role);
    for (const el of [kicker, role]) {
      expect(el).toHaveClass("font-spectral");
      expect(el).toHaveClass("text-[#3c78d8]");
      expect(el).toHaveClass("uppercase");
    }
    expect(role).toHaveClass("font-bold");
  });

  it("styles name in Domine foreground", () => {
    renderWithProviders(<Hero />);
    const name = screen.getByRole("heading", { level: 1 });
    expect(name).toHaveClass("font-domine");
    expect(name).toHaveClass("text-[#2d2a24]");
  });

  it("styles blurb in bold Quicksand mutedAlt", () => {
    renderWithProviders(<Hero />);
    const blurb = screen.getByText(RESUME.hero.blurb);
    expect(blurb).toHaveClass("font-quicksand");
    expect(blurb).toHaveClass("font-bold");
    expect(blurb).toHaveClass("text-[#6d6964]");
  });
});
