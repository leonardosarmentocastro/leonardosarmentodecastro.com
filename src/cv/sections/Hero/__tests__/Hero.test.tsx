import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/analytics/events", () => ({
  trackResumePdfClick: vi.fn(),
}));

import { trackResumePdfClick } from "@/analytics/events";
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

  it("uses a 230px portrait on mobile", () => {
    renderWithProviders(<Hero />);
    const avatar = screen.getByTestId("hero-avatar");
    const kicker = screen.getByText(RESUME.hero.kicker);
    expect(
      avatar.compareDocumentPosition(kicker) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(avatar).toHaveClass("h-[230px]", "w-[184px]");
    expect(avatar).toHaveClass("md:h-full", "md:w-44");
    expect(avatar).toHaveClass("object-cover");
  });

  it("uses 12px kicker and 20px name on mobile", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByText(RESUME.hero.kicker)).toHaveClass(
      "text-xs",
      "md:text-sm",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "text-[20px]",
      "md:text-4xl",
    );
  });

  it("centers hero copy and icon row on mobile", () => {
    renderWithProviders(<Hero />);
    const copy = screen.getByText(RESUME.hero.kicker).parentElement;
    expect(copy).toHaveClass("items-center", "text-center");
    expect(copy).toHaveClass("md:items-start", "md:text-left");
    expect(
      screen.getByRole("link", { name: /linkedin/i }).parentElement,
    ).toHaveClass("justify-center", "md:justify-start");
  });

  it("renders the six hero quick-links (LinkedIn, GitHub, Email, WhatsApp, Site, PDF)", () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.linkedin,
    );
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      RESUME.hero.links.github,
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
    expect(
      screen.getByRole("link", { name: /open resume pdf/i }),
    ).toHaveAttribute("href", RESUME.hero.links.resumePdf);
  });

  it("fires trackResumePdfClick when the resume PDF link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Hero />);

    await user.click(screen.getByRole("link", { name: /open resume pdf/i }));

    expect(trackResumePdfClick).toHaveBeenCalledTimes(1);
  });

  it("lists the personal site link last in the hero icon row", () => {
    renderWithProviders(<Hero />);
    const iconRow = screen.getByRole("link", {
      name: /linkedin/i,
    }).parentElement;
    const links = iconRow?.querySelectorAll("a") ?? [];
    expect(links[links.length - 1]).toHaveAttribute(
      "href",
      RESUME.hero.links.site,
    );
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
    expect(screen.getByRole("link", { name: /github/i })).toHaveClass(
      "hover:border-[#24292f]",
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
    expect(screen.getByRole("link", { name: /open resume pdf/i })).toHaveClass(
      "hover:border-[#dc2626]",
    );
  });
});
