import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ContactPrint } from "../ContactPrint";

describe("ContactPrint", () => {
  it("renders all five channels with their labels", () => {
    renderWithProviders(<ContactPrint />);
    for (const label of [
      "LinkedIn",
      "GitHub",
      "WhatsApp",
      "Email",
      "Personal Site",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the email address and whatsapp number as gray text", () => {
    renderWithProviders(<ContactPrint />);
    expect(
      screen.getByText("negocios.leonardosarmentocastro@gmail.com"),
    ).toBeInTheDocument();
    expect(screen.getByText(/\+55 \(12\) 98127-6618/)).toBeInTheDocument();
  });
});
