import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderWithProviders, screen, within } from "@/test/render";

import { workEntryAnchorId } from "../anchors";
import { Work } from "../Work";

describe("Work", () => {
  it("renders a Work Experience heading", () => {
    renderWithProviders(<Work />);
    expect(
      screen.getByRole("heading", { level: 2, name: /work experience/i }),
    ).toBeInTheDocument();
  });

  it("renders every company name", () => {
    renderWithProviders(<Work />);
    for (const w of RESUME.workExperience) {
      expect(screen.getByText(w.company)).toBeInTheDocument();
    }
  });

  it("renders collapsed header with company, period, role for first entry", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    expect(within(card).getByText(first.company)).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(first.role))).toBeInTheDocument();
  });

  it("shows description and bullets after expanding accordion", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    await user.click(within(card).getByRole("button"));
    expect(within(card).getByText(first.description)).toBeInTheDocument();
    expect(within(card).getByText(first.bullets[0])).toBeInTheDocument();
    expect(within(card).getByText(first.technologies[0])).toBeInTheDocument();
  });

  it("renders milestones as dividers not work entries", () => {
    renderWithProviders(<Work />);
    expect(screen.getAllByTestId("work-milestone").length).toBeGreaterThan(0);
    for (const m of RESUME.milestones) {
      expect(screen.getByText(m.text)).toBeInTheDocument();
    }
  });

  it("opens accordion on cv:open-work-entry event", async () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const anchorId = workEntryAnchorId(first);
    act(() => {
      document.dispatchEvent(
        new CustomEvent("cv:open-work-entry", { detail: anchorId }),
      );
    });
    expect(
      within(screen.getByTestId(`work-entry-${first.company}`)).getByRole(
        "button",
      ),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("applies full dark theme when accordion is expanded", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    await user.click(within(card).getByRole("button"));
    expect(card.querySelector("[data-slot=card]")).toHaveClass(
      "bg-neutral-900",
    );
  });

  it("exposes an accessible, pointer-styled accordion trigger per entry", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const card = screen.getByTestId(`work-entry-${first.company}`);
    const trigger = within(card).getByRole("button", {
      name: new RegExp(`toggle ${first.company}`, "i"),
    });
    expect(trigger).toHaveClass("cursor-pointer");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders a ping ring on timeline nodes when checkpoint is reached", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const row = screen
      .getByTestId(`work-timeline-node-${workEntryAnchorId(first)}`)
      .closest(".cv-work-checkpoint");
    expect(row?.querySelector(".cv-timeline-node-ping")).toBeInTheDocument();
    row?.classList.add("cv-checkpoint-reached");
    const ping = row?.querySelector(".cv-timeline-node-ping");
    expect(ping).toHaveClass("motion-safe:animate-ping");
  });

  it("renders double-ring timeline nodes aligned with date pills", () => {
    renderWithProviders(<Work />);
    const first = RESUME.workExperience[0];
    const node = screen.getByTestId(
      `work-timeline-node-${workEntryAnchorId(first)}`,
    );
    expect(node.querySelector(".cv-timeline-node-outer")).toBeInTheDocument();
    expect(node.querySelector(".cv-timeline-node-inner")).toBeInTheDocument();
  });

  it("uses light tech badges on expanded dark cards", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);
    const entry = screen.getByTestId("work-entry-Pinterest");
    await user.click(within(entry).getByRole("button"));
    const badge = within(entry)
      .getByText("React.js")
      .closest("[data-slot='badge']");
    expect(badge).toHaveClass("bg-neutral-100");
    expect(badge).toHaveClass("text-neutral-900");
  });

  it("places overlap cluster date pills above their cards", () => {
    renderWithProviders(<Work />);
    const pill = screen.getByTestId("work-date-pill-Écolheita");
    const entry = screen.getByTestId("work-entry-Écolheita");
    expect(
      pill.compareDocumentPosition(entry) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("isolates pointer events to each card in the sticky overlap cluster", () => {
    renderWithProviders(<Work />);
    const cluster = screen.getByTestId("work-sticky-cluster");
    expect(cluster).toHaveClass("pointer-events-none");

    for (const company of [
      "Écolheita",
      "PairTree",
      "PureCars",
      "Radical Imaging",
    ]) {
      const entry = within(cluster).getByTestId(`work-entry-${company}`);
      const row = entry.closest(".cv-work-checkpoint");
      expect(row).toHaveClass("pointer-events-none");
      expect(entry.parentElement).toHaveClass("pointer-events-auto");
      expect(entry.parentElement).toHaveClass("relative");
      expect(entry.parentElement).toHaveClass("z-30");
    }

    for (const company of ["PairTree", "PureCars", "Radical Imaging"]) {
      const entry = within(cluster).getByTestId(`work-entry-${company}`);
      const counterpartShell = entry.closest(
        ".cv-work-checkpoint",
      )?.parentElement;
      expect(counterpartShell).toHaveClass("pointer-events-none");
    }
  });

  it("expands both sticky and counterpart entries independently", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);

    const ecolheita = screen.getByTestId("work-entry-Écolheita");
    const pairTree = screen.getByTestId("work-entry-PairTree");

    await user.click(
      within(ecolheita).getByRole("button", { name: /toggle écolheita/i }),
    );
    await user.click(
      within(pairTree).getByRole("button", { name: /toggle pairtree/i }),
    );

    expect(within(ecolheita).getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(pairTree).getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("assigns data-lane from entry data", () => {
    renderWithProviders(<Work />);
    const ecolheita = screen.getByTestId("work-entry-Écolheita");
    expect(ecolheita).toHaveAttribute("data-lane", "left");
  });

  it("anchors each work entry with its workEntryAnchorId", () => {
    renderWithProviders(<Work />);
    for (const w of RESUME.workExperience) {
      const card = screen.getByTestId(`work-entry-${w.company}`);
      expect(card).toHaveAttribute("id", workEntryAnchorId(w));
    }
  });

  it("renders a tech icon inside badges for technologies with mapped aliases", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);
    const entry = screen.getByTestId("work-entry-Pinterest");
    await user.click(within(entry).getByRole("button"));
    const icons = entry.querySelectorAll('span[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]?.innerHTML).toContain("<svg");
  });

  it("still renders badge text for technologies with no mapped icon", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Work />);
    const entry = screen.getByTestId("work-entry-Pinterest");
    await user.click(within(entry).getByRole("button"));
    expect(within(entry).getByText("Pinterest Gestalt")).toBeInTheDocument();
  });
});
