import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { companyLogoSrc } from "@/cv/company-logos";
import { renderWithProviders, screen } from "@/test/render";

import { CompanyLogo } from "../CompanyLogo";

describe("companyLogoSrc", () => {
  it("maps every work experience company to an existing public asset", () => {
    for (const entry of RESUME.workExperience) {
      const src = companyLogoSrc(entry.company);
      expect(src, entry.company).toBeDefined();
      const file = path.join(process.cwd(), "public", src!.replace(/^\//, ""));
      expect(existsSync(file), `${entry.company} → ${src}`).toBe(true);
    }
  });
});

describe("CompanyLogo", () => {
  it("renders a square logo without a background wrapper", () => {
    renderWithProviders(<CompanyLogo company="Pinterest" />);
    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute("src", "/cv/companies/pinterest.jpg");
    expect(img).toHaveClass("w-12", "h-12", "md:w-[60px]", "md:h-[60px]", "object-contain");
    expect(img.parentElement).not.toHaveClass("bg-white");
  });
});
