import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { CompanyLogo } from "../CompanyLogo";

describe("CompanyLogo", () => {
  it("renders an img with the correct src for a known company", () => {
    renderWithProviders(<CompanyLogo company="Pinterest" />);
    const img = screen.getByRole("img", { name: "Pinterest" });
    expect(img).toHaveAttribute("src", expect.stringContaining("pinterest.png"));
  });
});
