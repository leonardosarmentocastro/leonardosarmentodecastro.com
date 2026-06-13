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
});
