import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { CVPrintPage } from "../CVPrintPage";

describe("CVPrintPage", () => {
  it("renders the print CV: no hero icons, no Get-in-Touch, Contact present, work expanded", () => {
    renderWithProviders(<CVPrintPage />);
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /get in touch/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^contact$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /work experience/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("work-print-node").length).toBeGreaterThan(0);
    expect(screen.getByTestId("company-logo-static")).toBeInTheDocument();
  });

  it("orders Contact right after About and before Work", () => {
    renderWithProviders(<CVPrintPage />);
    const about = document.getElementById("about");
    const contact = document.getElementById("contact");
    const work = document.getElementById("work");
    expect(about).not.toBeNull();
    expect(contact).not.toBeNull();
    expect(work).not.toBeNull();
    if (about && contact && work) {
      // DOCUMENT_POSITION_FOLLOWING (4): the argument node comes after `this`.
      expect(about.compareDocumentPosition(contact) & 4).toBeTruthy();
      expect(contact.compareDocumentPosition(work) & 4).toBeTruthy();
    }
  });
});
