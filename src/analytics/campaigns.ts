export const CAMPAIGN_SOURCES = [
  "linkedin",
  "twitter",
  "github",
  "email",
  "newsletter",
] as const;
export type CampaignSource = (typeof CAMPAIGN_SOURCES)[number];

export const CAMPAIGN_MEDIUMS = ["social", "email", "referral"] as const;
export type CampaignMedium = (typeof CAMPAIGN_MEDIUMS)[number];

export type CampaignParams = {
  source: CampaignSource;
  medium: CampaignMedium;
  campaign: string;
  content?: string;
  path?: string;
  baseUrl?: string;
};

export const buildCampaignUrl = (params: CampaignParams): string => {
  const base = params.baseUrl ?? "https://leonardosarmentodecastro.com";
  const url = new URL(params.path ?? "/", base);
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  if (params.content !== undefined) {
    url.searchParams.set("utm_content", params.content);
  }
  return url.toString();
};
