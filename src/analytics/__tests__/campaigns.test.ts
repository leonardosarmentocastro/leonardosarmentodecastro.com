import { describe, expect, it } from "vitest";
import { buildCampaignUrl } from "@/analytics/campaigns";

describe("buildCampaignUrl", () => {
  it("builds a URL with the required UTM params, default base, and root path", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });

  it("URL-encodes campaign values that contain characters needing encoding", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "needs encoding & stuff",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=needs+encoding+%26+stuff",
    );
  });

  it("appends utm_content when content is provided", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        content: "hero-cta",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026&utm_content=hero-cta",
    );
  });

  it("honours a custom path override", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        path: "/about",
      }),
    ).toBe(
      "https://leonardosarmentodecastro.com/about?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });

  it("honours a custom baseUrl override (e.g. the shorter canonical host)", () => {
    expect(
      buildCampaignUrl({
        source: "linkedin",
        medium: "social",
        campaign: "job-search-2026",
        baseUrl: "https://leonardosarmentocastro.com",
      }),
    ).toBe(
      "https://leonardosarmentocastro.com/?utm_source=linkedin&utm_medium=social&utm_campaign=job-search-2026",
    );
  });
});
