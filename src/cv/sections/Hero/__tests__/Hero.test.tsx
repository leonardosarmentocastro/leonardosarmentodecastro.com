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
    expect(
      screen.getByText(
        /Senior Software Engineer with 10\+ years of experience/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Experienced working closely with US product teams/),
    ).toBeInTheDocument();
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

  it("renders kicker, role, then name in PDF order", () => {
    renderWithProviders(<Hero />);
    const kicker = screen.getByText(RESUME.hero.kicker);
    const role = screen.getByText(RESUME.hero.role);
    const name = screen.getByRole("heading", { level: 1 });
    expect(
      kicker.compareDocumentPosition(role) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      role.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("styles kicker and role in uppercase Spectral blue", () => {
    renderWithProviders(<Hero />);
    const kicker = screen.getByText(RESUME.hero.kicker);
    const role = screen.getByText(RESUME.hero.role);
    for (const el of [kicker, role]) {
      expect(el).toHaveClass("font-spectral");
      expect(el).toHaveClass("text-[#3c78d8]");
      expect(el).toHaveClass("uppercase");
      expect(el).toHaveClass("font-bold");
    }
  });

  it("styles name in Domine foreground", () => {
    renderWithProviders(<Hero />);
    const name = screen.getByRole("heading", { level: 1 });
    expect(name).toHaveClass("font-domine");
    expect(name).toHaveClass("text-[#2d2a24]");
  });

  it("styles location in Quicksand muted", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByText(RESUME.hero.location)).toHaveClass(
      "font-quicksand",
      "text-[#6c6965]",
    );
  });

  it("bolds only the blurb lead sentence in Quicksand mutedAlt", () => {
    renderWithProviders(<Hero />);
    const lead = screen.getByText(
      "Senior Software Engineer with 10+ years of experience",
    );
    expect(lead).toHaveClass("font-bold");
    expect(lead.closest("p")).toHaveClass("font-quicksand", "text-[#6d6964]");
    expect(lead.closest("p")).not.toHaveClass("font-bold");
  });

  it("applies brand hover borders to hero icon links", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveClass(
      "hover:border-[#0072b1]",
    );
    expect(screen.getByRole("link", { name: /email/i })).toHaveClass(
      "hover:border-[#bb001b]",
    );
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveClass(
      "hover:border-[#128c7e]",
    );
    expect(screen.getByRole("link", { name: /personal site/i })).toHaveClass(
      "hover:border-black",
    );
  });
});
