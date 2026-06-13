#!/usr/bin/env -S pnpm tsx
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  text,
} from "@clack/prompts";
import {
  buildCampaignUrl,
  CAMPAIGN_MEDIUMS,
  CAMPAIGN_SOURCES,
  type CampaignMedium,
  type CampaignParams,
  type CampaignSource,
} from "@/analytics/campaigns";

const REPO_PATH = "leonardosarmentocastro/leonardosarmentodecastro.com";
const SLUG_RE = /^[a-z0-9-]+$/;

const exitOnCancel = <T>(value: T | symbol): T => {
  if (isCancel(value)) {
    cancel("Cancelled. No URL generated.");
    process.exit(0);
  }
  return value as T;
};

const main = async (): Promise<void> => {
  intro("Generate a campaign URL");

  const source = exitOnCancel(
    await select<CampaignSource>({
      message: "Source?",
      options: CAMPAIGN_SOURCES.map((value) => ({ value, label: value })),
    }),
  );

  const medium = exitOnCancel(
    await select<CampaignMedium>({
      message: "Medium?",
      options: CAMPAIGN_MEDIUMS.map((value) => ({ value, label: value })),
    }),
  );

  const campaign = exitOnCancel(
    await text({
      message: "Campaign slug? (lowercase, [a-z0-9-]+)",
      placeholder: "job-search-2026",
      validate: (raw) => {
        if (raw.length === 0) return "Required.";
        if (!SLUG_RE.test(raw))
          return "Use only lowercase letters, digits, and hyphens.";
      },
    }),
  );

  const wantsContent = exitOnCancel(
    await confirm({
      message:
        "Add utm_content? (rare — only for A/B variants of the same post)",
      initialValue: false,
    }),
  );
  const content = wantsContent
    ? exitOnCancel(
        await text({
          message: "utm_content value",
          placeholder: "hero-cta",
          validate: (raw) => (raw.length === 0 ? "Required." : undefined),
        }),
      )
    : undefined;

  const overridePath = exitOnCancel(
    await confirm({
      message: 'Override path? (default "/")',
      initialValue: false,
    }),
  );
  const path = overridePath
    ? exitOnCancel(
        await text({
          message: "Path",
          placeholder: "/about",
          validate: (raw) =>
            raw.startsWith("/") ? undefined : 'Must start with "/".',
        }),
      )
    : undefined;

  const overrideBase = exitOnCancel(
    await confirm({
      message:
        "Override base URL? (default https://leonardosarmentodecastro.com)",
      initialValue: false,
    }),
  );
  const baseUrl = overrideBase
    ? exitOnCancel(
        await text({
          message: "Base URL",
          placeholder: "https://leonardosarmentocastro.com",
          validate: (raw) => {
            try {
              new URL(raw);
              return undefined;
            } catch {
              return "Must be a valid absolute URL.";
            }
          },
        }),
      )
    : undefined;

  const params: CampaignParams = {
    source,
    medium,
    campaign,
    content,
    path,
    baseUrl,
  };

  const url = buildCampaignUrl(params);

  const issueParams = new URLSearchParams({
    template: "campaign.yml",
    title: `[campaign] ${source}/${campaign}`,
    url,
  });
  const issueUrl = `https://github.com/${REPO_PATH}/issues/new?${issueParams.toString()}`;

  outro(`URL: ${url}\n\n📋 Track this campaign:\n${issueUrl}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
