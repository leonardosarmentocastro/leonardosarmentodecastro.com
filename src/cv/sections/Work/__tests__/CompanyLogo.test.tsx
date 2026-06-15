import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { CompanyLogo } from "../CompanyLogo";

describe("CompanyLogo", () => {
  it("renders an img with the correct src for a known company", () => {
    renderWithProviders(<CompanyLogo company="Pinterest" />);
    const img = screen.getByRole("img", { name: "Pinterest" });
    expect(img).toHaveAttribute("src", expect.stringContaining("pinterest.png"));
  });

  it("renders initials when the company has no entry in COMPANY_LOGOS", () => {
    renderWithProviders(<CompanyLogo company="Unknown Corp" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("UC")).toBeInTheDocument();
  });

  it("renders a single initial for single-word company names", () => {
    renderWithProviders(<CompanyLogo company="Acme" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
