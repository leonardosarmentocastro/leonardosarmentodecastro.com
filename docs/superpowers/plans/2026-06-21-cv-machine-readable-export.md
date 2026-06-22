# CV Machine-Readable Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two read-only export surfaces derived from `RESUME` — `/api/cv/json` (JSON Resume standard) and `/cv/ats` (server-generated ATS PDF) — so the resume never drifts from the site.

**Architecture:** All export logic lives in a new `src/cv/export/` domain folder as pure, unit-tested mappers (`toJsonResume`, `buildAtsResume`) plus a thin `@react-pdf/renderer` component. Two thin Next.js App Router route handlers import `RESUME`, call a mapper, and return a response. The hard-to-test PDF renderer is kept dumb by isolating all content/layout decisions in a pure view-model.

**Tech Stack:** Next.js 15 App Router (route handlers), React 19, TypeScript (strict), Vitest + jsdom, Biome, `@react-pdf/renderer` (new), pnpm.

## Global Constraints

- **Never commit to `main`.** All work happens on a feature branch (this plan assumes `feat/cv-machine-readable-export`).
- Package manager is **pnpm** only (`pnpm add`, `pnpm test:run`, `pnpm lint`). Never `npm`/`yarn`.
- Linter/formatter is **Biome**: run `pnpm lint` before each commit.
- Path alias `@/*` → `src/*`.
- Organize by domain: new code under `src/cv/export/`; never create `src/services/`, `src/utils/`, etc.
- Tests colocated in a `__tests__/` subfolder next to the source.
- TDD: red → green → refactor. Atomic commits — one deliverable per commit.
- `RESUME` (`src/cv/data.ts`) stays the single source of truth; exports are read-only and derive from it.
- Route handlers that use `@react-pdf/renderer` MUST pin `export const runtime = "nodejs"`.
- Conventional Commits for messages; end each commit body with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/cv/export/json-resume.ts` | `JsonResume` type + `toJsonResume(resume)`; pure helpers `toIsoMonth`, `parseLocation`. |
| `src/cv/export/__tests__/json-resume.test.ts` | Unit tests for the JSON mapper + helpers. |
| `src/app/api/cv/json/route.ts` | Thin `GET` handler: returns `toJsonResume(RESUME)` as JSON with permissive CORS. |
| `src/app/api/cv/json/__tests__/route.test.ts` | Route test: 200, content-type, CORS, parseable body. |
| `src/cv/export/ats-view-model.ts` | `AtsResume` type + `buildAtsResume(resume)`; pure layout/content decisions for the PDF. |
| `src/cv/export/__tests__/ats-view-model.test.ts` | Unit tests for the view-model. |
| `src/cv/export/AtsResumeDocument.tsx` | `@react-pdf/renderer` component + `renderAtsPdf(viewModel)` helper. |
| `src/cv/export/__tests__/AtsResumeDocument.test.ts` | Smoke test: renders a non-empty `%PDF` buffer. |
| `src/app/cv/ats/route.ts` | Thin `GET` handler: renders the PDF, returns `application/pdf` as an attachment. |
| `src/app/cv/ats/__tests__/route.test.ts` | Route test: 200, content-type, attachment disposition, `%PDF`. |
| `src/cv/export/README.md` | Domain README: endpoints, JSON mapping table, `work[].keywords` → `skills[]` join rule. |
| `README.md` (modify) | Add the new export folder + routes to the project-structure map. |

---

## Task 1: JSON Resume mapper

**Files:**
- Create: `src/cv/export/json-resume.ts`
- Test: `src/cv/export/__tests__/json-resume.test.ts`

**Interfaces:**
- Consumes: `Resume`, `SkillLevel`, `WorkExperience` types from `@/cv/types`; `RESUME` from `@/cv/data` (tests only).
- Produces:
  - `toJsonResume(resume: Resume): JsonResume`
  - `toIsoMonth(value: string): string` — `"Aug 2024"` → `"2024-08"`, throws on bad input
  - `parseLocation(raw: string): { city: string; region: string; countryCode: string }`
  - exported types `JsonResume`, `JsonResumeBasics`, `JsonResumeWork`, `JsonResumeEducation`, `JsonResumeSkill`, `JsonResumeLanguage`, `JsonResumeProfile`

- [ ] **Step 1: Write the failing test**

Create `src/cv/export/__tests__/json-resume.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { parseLocation, toIsoMonth, toJsonResume } from "../json-resume";

describe("toIsoMonth", () => {
  it("converts 'Aug 2024' to '2024-08'", () => {
    expect(toIsoMonth("Aug 2024")).toBe("2024-08");
  });

  it("throws on unrecognized input", () => {
    expect(() => toIsoMonth("Present")).toThrow();
  });
});

describe("parseLocation", () => {
  it("splits city, region and country code, stripping the flag emoji", () => {
    expect(parseLocation("São José dos Campos, São Paulo — Brazil 🇧🇷")).toEqual({
      city: "São José dos Campos",
      region: "São Paulo",
      countryCode: "BR",
    });
  });
});

describe("toJsonResume", () => {
  const json = toJsonResume(RESUME);

  it("maps basics from the hero", () => {
    expect(json.basics.name).toBe(RESUME.hero.name);
    expect(json.basics.label).toBe(RESUME.hero.role);
    expect(json.basics.summary).toBe(RESUME.hero.blurb);
    expect(json.basics.email).toBe(RESUME.hero.links.email);
    expect(json.basics.phone).toBe(RESUME.hero.links.whatsappDisplay);
    expect(json.basics.url).toBe(RESUME.hero.links.site);
  });

  it("builds LinkedIn and GitHub profiles", () => {
    const networks = json.basics.profiles.map((p) => p.network);
    expect(networks).toEqual(["LinkedIn", "GitHub"]);
    const github = json.basics.profiles.find((p) => p.network === "GitHub");
    expect(github?.username).toBe("leonardosarmentocastro");
  });

  it("includes per-job technologies as work[].keywords", () => {
    const pinterest = json.work.find((w) => w.name === "Pinterest");
    expect(pinterest?.keywords).toEqual(RESUME.workExperience[0].technologies);
    expect(pinterest?.keywords).toContain("TypeScript");
  });

  it("maps start/end dates to ISO months", () => {
    const pinterest = json.work.find((w) => w.name === "Pinterest");
    expect(pinterest?.startDate).toBe("2024-08");
    expect(pinterest?.endDate).toBe("2026-05");
  });

  it("omits endDate for ongoing roles ('Present')", () => {
    const withPresent: typeof RESUME = {
      ...RESUME,
      workExperience: [
        { ...RESUME.workExperience[0], endDate: "Present" },
        ...RESUME.workExperience.slice(1),
      ],
    };
    const result = toJsonResume(withPresent);
    expect(result.work[0]).not.toHaveProperty("endDate");
    expect(result.work[0].startDate).toBe("2024-08");
  });

  it("maps Communication skills into languages, not skills", () => {
    expect(json.languages.map((l) => l.language)).toEqual(["English", "Portuguese"]);
    expect(json.languages.find((l) => l.language === "Portuguese")?.fluency).toBe(
      "Native or bilingual proficiency",
    );
    expect(json.skills.some((s) => s.name === "English")).toBe(false);
  });

  it("maps technical skills with aliases as keywords", () => {
    const js = json.skills.find((s) => s.name === "JavaScript");
    expect(js?.level).toBe("Expert");
    expect(js?.keywords).toEqual(["JavaScript"]);
  });

  it("does not include milestones anywhere", () => {
    expect(JSON.stringify(json)).not.toContain("Looking for new opportunities");
  });

  it("derives education start/end from the period", () => {
    expect(json.education[0].institution).toBe(RESUME.education[0].school);
    expect(json.education[0].startDate).toBe("2009");
    expect(json.education[0].endDate).toBe("2011");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/export/__tests__/json-resume.test.ts`
Expected: FAIL — cannot resolve `../json-resume` (module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `src/cv/export/json-resume.ts`:

```ts
import type { Resume, SkillLevel, WorkExperience } from "@/cv/types";

export type JsonResumeProfile = {
  network: string;
  username: string;
  url: string;
};

export type JsonResumeBasics = {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: { city: string; region: string; countryCode: string };
  profiles: JsonResumeProfile[];
};

export type JsonResumeWork = {
  name: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary: string;
  highlights: string[];
  keywords: string[];
};

export type JsonResumeEducation = {
  institution: string;
  studyType: string;
  startDate: string;
  endDate: string;
};

export type JsonResumeSkill = {
  name: string;
  level: string;
  keywords: string[];
};

export type JsonResumeLanguage = {
  language: string;
  fluency: string;
};

export type JsonResume = {
  $schema: string;
  basics: JsonResumeBasics;
  work: JsonResumeWork[];
  education: JsonResumeEducation[];
  skills: JsonResumeSkill[];
  languages: JsonResumeLanguage[];
};

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

const COUNTRY_CODES: Record<string, string> = { Brazil: "BR" };

const FLUENCY_BY_LEVEL: Record<SkillLevel, string> = {
  Expert: "Native or bilingual proficiency",
  Advanced: "Professional working proficiency",
  Experienced: "Limited working proficiency",
};

/** "Aug 2024" -> "2024-08". Throws on unrecognized input. */
export function toIsoMonth(value: string): string {
  const [month, year] = value.trim().split(/\s+/);
  const mm = MONTHS[month];
  if (!mm || !/^\d{4}$/.test(year ?? "")) {
    throw new Error(`Unrecognized month value: "${value}"`);
  }
  return `${year}-${mm}`;
}

/** "São José dos Campos, São Paulo — Brazil 🇧🇷" -> structured location. */
export function parseLocation(raw: string) {
  const noFlag = raw.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
  const [city = "", rest = ""] = noFlag.split(",").map((s) => s.trim());
  const [region = "", country = ""] = rest.split("—").map((s) => s.trim());
  return { city, region, countryCode: COUNTRY_CODES[country] ?? country };
}

function profileFromUrl(network: string, url: string): JsonResumeProfile {
  const username = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return { network, username, url };
}

function toWork(entry: WorkExperience): JsonResumeWork {
  const work: JsonResumeWork = {
    name: entry.company,
    position: entry.role,
    startDate: toIsoMonth(entry.startDate),
    summary: entry.description,
    highlights: entry.bullets,
    keywords: entry.technologies,
  };
  if (entry.endDate !== "Present") {
    work.endDate = toIsoMonth(entry.endDate);
  }
  return work;
}

/** Education period "2009 — 2011" -> { startDate, endDate }. */
function parseEducationPeriod(period: string) {
  const [startDate = "", endDate = ""] = period.split("—").map((s) => s.trim());
  return { startDate, endDate };
}

export function toJsonResume(resume: Resume): JsonResume {
  const languages = resume.skills.filter((s) => s.category === "Communication");
  const technical = resume.skills.filter((s) => s.category !== "Communication");

  return {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: resume.hero.name,
      label: resume.hero.role,
      email: resume.hero.links.email,
      phone: resume.hero.links.whatsappDisplay,
      url: resume.hero.links.site,
      summary: resume.hero.blurb,
      location: parseLocation(resume.hero.location),
      profiles: [
        profileFromUrl("LinkedIn", resume.hero.links.linkedin),
        profileFromUrl("GitHub", resume.hero.links.github),
      ],
    },
    work: resume.workExperience.map(toWork),
    education: resume.education.map((e) => ({
      institution: e.school,
      studyType: e.degree,
      ...parseEducationPeriod(e.period),
    })),
    skills: technical.map((s) => ({
      name: s.name,
      level: s.level,
      keywords: s.aliases,
    })),
    languages: languages.map((s) => ({
      language: s.name,
      fluency: FLUENCY_BY_LEVEL[s.level],
    })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/export/__tests__/json-resume.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no errors (autofixes applied if any).

- [ ] **Step 6: Commit**

```bash
git add src/cv/export/json-resume.ts src/cv/export/__tests__/json-resume.test.ts
git commit -m "$(cat <<'EOF'
feat(cv): add JSON Resume mapper for RESUME

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: JSON export route

**Files:**
- Create: `src/app/api/cv/json/route.ts`
- Test: `src/app/api/cv/json/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `toJsonResume` from `@/cv/export/json-resume`; `RESUME` from `@/cv/data`.
- Produces: `GET(): Response` exported from the route module.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/cv/json/__tests__/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /api/cv/json", () => {
  it("returns JSON Resume with a 200 and JSON content type", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("sends a permissive CORS header for the scraper", () => {
    const res = GET();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("serializes the mapped resume", async () => {
    const body = await GET().json();
    expect(body.basics.name).toBe("Leonardo Sarmento de Castro");
    expect(Array.isArray(body.work)).toBe(true);
    expect(body.work[0].keywords.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/app/api/cv/json/__tests__/route.test.ts`
Expected: FAIL — cannot resolve `../route`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/app/api/cv/json/route.ts`:

```ts
import { NextResponse } from "next/server";

import { RESUME } from "@/cv/data";
import { toJsonResume } from "@/cv/export/json-resume";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(toJsonResume(RESUME), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/app/api/cv/json/__tests__/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cv/json/route.ts src/app/api/cv/json/__tests__/route.test.ts
git commit -m "$(cat <<'EOF'
feat(cv): expose /api/cv/json JSON Resume endpoint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: ATS PDF view-model

**Files:**
- Create: `src/cv/export/ats-view-model.ts`
- Test: `src/cv/export/__tests__/ats-view-model.test.ts`

**Interfaces:**
- Consumes: `Resume`, `Skill`, `WorkExperience` types from `@/cv/types`; `RESUME` from `@/cv/data` (tests only).
- Produces:
  - `buildAtsResume(resume: Resume): AtsResume`
  - exported types `AtsResume`, `AtsExperience`, `AtsEducation`, `AtsSkillGroup`

- [ ] **Step 1: Write the failing test**

Create `src/cv/export/__tests__/ats-view-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { buildAtsResume } from "../ats-view-model";

describe("buildAtsResume", () => {
  const ats = buildAtsResume(RESUME);

  it("carries name, headline and summary from the hero", () => {
    expect(ats.name).toBe(RESUME.hero.name);
    expect(ats.headline).toBe(RESUME.hero.role);
    expect(ats.summary).toBe(RESUME.hero.blurb);
  });

  it("builds a flag-free contact line containing the email", () => {
    expect(ats.contact).toContain(RESUME.hero.links.email);
    expect(ats.contact).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
  });

  it("lists LinkedIn and GitHub links", () => {
    expect(ats.links.some((l) => l.includes(RESUME.hero.links.linkedin))).toBe(true);
    expect(ats.links.some((l) => l.includes(RESUME.hero.links.github))).toBe(true);
  });

  it("includes every work entry with a date range", () => {
    expect(ats.experience).toHaveLength(RESUME.workExperience.length);
    expect(ats.experience[0].dateRange).toBe(
      `${RESUME.workExperience[0].startDate} – ${RESUME.workExperience[0].endDate}`,
    );
  });

  it("falls back to capitalized work mode when location is absent", () => {
    const pinterest = ats.experience.find((e) => e.company === "Pinterest");
    expect(pinterest?.location).toBe("Remote");
    const spark = ats.experience.find((e) => e.company === "Spark Networks");
    expect(spark?.location).toBe("Berlin, Germany");
  });

  it("groups skills by category", () => {
    const categories = ats.skills.map((g) => g.category);
    expect(categories).toContain("Languages");
    expect(categories).toContain("Communication");
    const languages = ats.skills.find((g) => g.category === "Languages");
    expect(languages?.entries.some((e) => e.startsWith("JavaScript"))).toBe(true);
  });

  it("maps education entries verbatim", () => {
    expect(ats.education[0]).toEqual({
      school: RESUME.education[0].school,
      degree: RESUME.education[0].degree,
      period: RESUME.education[0].period,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/export/__tests__/ats-view-model.test.ts`
Expected: FAIL — cannot resolve `../ats-view-model`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/cv/export/ats-view-model.ts`:

```ts
import type { Resume, Skill, WorkExperience } from "@/cv/types";

export type AtsExperience = {
  company: string;
  role: string;
  dateRange: string;
  location: string;
  bullets: string[];
};

export type AtsEducation = {
  school: string;
  degree: string;
  period: string;
};

export type AtsSkillGroup = {
  category: string;
  entries: string[];
};

export type AtsResume = {
  name: string;
  headline: string;
  contact: string;
  links: string[];
  summary: string;
  skills: AtsSkillGroup[];
  experience: AtsExperience[];
  education: AtsEducation[];
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function stripFlags(value: string): string {
  return value.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim();
}

function toExperience(entry: WorkExperience): AtsExperience {
  return {
    company: entry.company,
    role: entry.role,
    dateRange: `${entry.startDate} – ${entry.endDate}`,
    location: entry.location ?? capitalize(entry.workMode),
    bullets: entry.bullets,
  };
}

function groupSkills(skills: Skill[]): AtsSkillGroup[] {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(`${skill.name} — ${skill.level}`);
    groups.set(skill.category, list);
  }
  return [...groups].map(([category, entries]) => ({ category, entries }));
}

export function buildAtsResume(resume: Resume): AtsResume {
  return {
    name: resume.hero.name,
    headline: resume.hero.role,
    contact: [
      stripFlags(resume.hero.location),
      resume.hero.links.email,
      resume.hero.links.whatsappDisplay,
      resume.hero.links.site,
    ].join("  ·  "),
    links: [
      `LinkedIn: ${resume.hero.links.linkedin}`,
      `GitHub: ${resume.hero.links.github}`,
    ],
    summary: resume.hero.blurb,
    skills: groupSkills(resume.skills),
    experience: resume.workExperience.map(toExperience),
    education: resume.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      period: e.period,
    })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/export/__tests__/ats-view-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/cv/export/ats-view-model.ts src/cv/export/__tests__/ats-view-model.test.ts
git commit -m "$(cat <<'EOF'
feat(cv): add ATS resume view-model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: ATS PDF document + renderer

**Files:**
- Modify: `package.json` (add `@react-pdf/renderer`)
- Create: `src/cv/export/AtsResumeDocument.tsx`
- Test: `src/cv/export/__tests__/AtsResumeDocument.test.ts`

**Interfaces:**
- Consumes: `AtsResume` type from `@/cv/export/ats-view-model`; `buildAtsResume` + `RESUME` (tests only).
- Produces:
  - `AtsResumeDocument(props: { resume: AtsResume }): JSX.Element`
  - `renderAtsPdf(resume: AtsResume): Promise<Buffer>`

- [ ] **Step 1: Install the dependency**

Run: `pnpm add @react-pdf/renderer`
Expected: package added to `dependencies` in `package.json`; lockfile updated.

- [ ] **Step 2: Write the failing test**

Create `src/cv/export/__tests__/AtsResumeDocument.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { renderAtsPdf } from "../AtsResumeDocument";
import { buildAtsResume } from "../ats-view-model";

describe("renderAtsPdf", () => {
  it("produces a non-empty PDF buffer", async () => {
    const pdf = await renderAtsPdf(buildAtsResume(RESUME));
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  }, 30000);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test:run src/cv/export/__tests__/AtsResumeDocument.test.ts`
Expected: FAIL — cannot resolve `../AtsResumeDocument`.

- [ ] **Step 4: Write the minimal implementation**

Create `src/cv/export/AtsResumeDocument.tsx`:

```tsx
import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { AtsResume } from "./ats-view-model";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#222222",
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 11, marginTop: 2 },
  contact: { fontSize: 9, color: "#444444", marginTop: 4 },
  link: { fontSize: 9, color: "#444444" },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  skillLine: { marginBottom: 2 },
  jobHeader: { fontFamily: "Helvetica-Bold" },
  jobMeta: { fontSize: 9, color: "#555555", marginBottom: 3 },
  bullet: { marginLeft: 10, marginBottom: 2 },
});

export function AtsResumeDocument({ resume }: { resume: AtsResume }) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.headline}>{resume.headline}</Text>
        <Text style={styles.contact}>{resume.contact}</Text>
        {resume.links.map((link) => (
          <Text key={link} style={styles.link}>
            {link}
          </Text>
        ))}

        <Text style={styles.heading}>Summary</Text>
        <Text>{resume.summary}</Text>

        <Text style={styles.heading}>Skills</Text>
        {resume.skills.map((group) => (
          <Text key={group.category} style={styles.skillLine}>
            {group.category}: {group.entries.join(", ")}
          </Text>
        ))}

        <Text style={styles.heading}>Experience</Text>
        {resume.experience.map((job) => (
          <View key={`${job.company}-${job.dateRange}`} wrap={false}>
            <Text style={styles.jobHeader}>
              {job.role} — {job.company}
            </Text>
            <Text style={styles.jobMeta}>
              {job.dateRange} · {job.location}
            </Text>
            {job.bullets.map((bullet) => (
              <Text key={bullet} style={styles.bullet}>
                • {bullet}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.heading}>Education</Text>
        {resume.education.map((edu) => (
          <View key={edu.school}>
            <Text style={styles.jobHeader}>{edu.degree}</Text>
            <Text style={styles.jobMeta}>
              {edu.school} · {edu.period}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function renderAtsPdf(resume: AtsResume): Promise<Buffer> {
  return renderToBuffer(<AtsResumeDocument resume={resume} />);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test:run src/cv/export/__tests__/AtsResumeDocument.test.ts`
Expected: PASS — buffer begins with `%PDF`.

> If the render throws because `@react-pdf/renderer` cannot resolve in jsdom,
> add `import "@react-pdf/renderer";` is not the fix — instead confirm the test
> environment runs in Node (it does: vitest uses jsdom on the Node runtime, and
> `renderToBuffer` is Node-only). Built-in Helvetica needs no font files, so no
> extra setup is required.

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/cv/export/AtsResumeDocument.tsx src/cv/export/__tests__/AtsResumeDocument.test.ts
git commit -m "$(cat <<'EOF'
feat(cv): render ATS resume as a PDF document

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: ATS PDF download route

**Files:**
- Create: `src/app/cv/ats/route.ts`
- Test: `src/app/cv/ats/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `renderAtsPdf` from `@/cv/export/AtsResumeDocument`; `buildAtsResume` from `@/cv/export/ats-view-model`; `RESUME` from `@/cv/data`.
- Produces: `GET(): Promise<Response>` exported from the route module.

- [ ] **Step 1: Write the failing test**

Create `src/app/cv/ats/__tests__/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /cv/ats", () => {
  it("returns a downloadable PDF attachment", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(".pdf");
  }, 30000);

  it("returns real PDF bytes", async () => {
    const res = await GET();
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  }, 30000);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/app/cv/ats/__tests__/route.test.ts`
Expected: FAIL — cannot resolve `../route`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/app/cv/ats/route.ts`:

```ts
import { RESUME } from "@/cv/data";
import { renderAtsPdf } from "@/cv/export/AtsResumeDocument";
import { buildAtsResume } from "@/cv/export/ats-view-model";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pdf = await renderAtsPdf(buildAtsResume(RESUME));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/app/cv/ats/__tests__/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify the production build accepts the route**

Run: `pnpm build`
Expected: build succeeds and lists `/cv/ats` and `/api/cv/json` among the routes.

> If `pnpm build` fails specifically on statically generating `/cv/ats`
> (binary body + `force-static`), remove `export const dynamic = "force-static";`
> from `src/app/cv/ats/route.ts` (leave `runtime = "nodejs"`) and re-run the
> build. Note the change in the commit body.

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/cv/ats/route.ts src/app/cv/ats/__tests__/route.test.ts
git commit -m "$(cat <<'EOF'
feat(cv): expose /cv/ats PDF download route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Export domain documentation

**Files:**
- Create: `src/cv/export/README.md`
- Modify: `README.md` (project-structure map)

**Interfaces:**
- Consumes: nothing at runtime — documents Tasks 1–5.
- Produces: documentation only.

- [ ] **Step 1: Write the export domain README**

Create `src/cv/export/README.md`:

````markdown
# `src/cv/export/`

Read-only machine-readable exports derived from `RESUME` (`src/cv/data.ts`).
`data.ts` stays the single source of truth — these surfaces re-derive from it on
every deploy, so they never drift from the site.

## Endpoints

| URL | Output | Source mapper | Consumer |
| --- | --- | --- | --- |
| `/api/cv/json` | [JSON Resume](https://jsonresume.org/schema) standard | `toJsonResume` (`json-resume.ts`) | job-hunter scraper (machine) |
| `/cv/ats` | Single-column, selectable-text PDF (attachment download) | `buildAtsResume` + `AtsResumeDocument` | hiring platforms / ATS |

Both route handlers run on the Node.js runtime (`export const runtime = "nodejs"`),
required by `@react-pdf/renderer`. `/api/cv/json` sends `Access-Control-Allow-Origin: *`
because the data is public and a cross-origin scraper may fetch it directly.

## Files

| File | Purpose |
| --- | --- |
| `json-resume.ts` | `toJsonResume(resume)` → JSON Resume object; pure helpers `toIsoMonth`, `parseLocation`. |
| `ats-view-model.ts` | `buildAtsResume(resume)` → plain, ordered section data (all PDF content/layout decisions live here, so they are unit-testable without rendering). |
| `AtsResumeDocument.tsx` | `@react-pdf/renderer` component + `renderAtsPdf(viewModel)` helper. |

## JSON Resume mapping

| JSON Resume field | Source in `RESUME` |
| --- | --- |
| `basics.{name,label,summary,email,phone,url}` | `hero.name` / `hero.role` / `hero.blurb` / `hero.links.email` / `hero.links.whatsappDisplay` / `hero.links.site` |
| `basics.location` | parsed from `hero.location` (flag emoji stripped; `Brazil` → `BR`) |
| `basics.profiles[]` | `hero.links.linkedin`, `hero.links.github` |
| `work[].{name,position,startDate,endDate,summary,highlights}` | `workExperience[].{company,role,startDate,endDate,description,bullets}` (dates → `YYYY-MM`; `"Present"` omits `endDate`) |
| `work[].keywords` | `workExperience[].technologies` |
| `education[].{institution,studyType,startDate,endDate}` | `education[].{school,degree}` + parsed `period` |
| `skills[].{name,level,keywords}` | non-`Communication` `skills[]` (`aliases` → `keywords`) |
| `languages[]` | `Communication` skills (English, Portuguese) |

**Not exported:** milestones (no JSON Resume home, low matching value).

## Consumer join rule (skill strength inference)

`work[].keywords` strings are emitted **unchanged** from `workExperience[].technologies`.
These match `skills[].keywords` (the `aliases`) exactly — the same mapping
`src/cv/sections/Skills/matching.ts` relies on for the site's skill↔work
navigation. A consumer can therefore:

1. Read each `skills[]` entry for the engineer's **self-assessed** level.
2. Join `work[].keywords` → `skills[]` by exact, case-insensitive match to get
   the **evidence**: which jobs used each technology, their dates, and durations.

This lets the scraper compute per-technology `firstUsed` / `lastUsed` /
`totalMonths` / `jobCount` deterministically — no guessing.

## Editing

Change `src/cv/data.ts`. Both endpoints re-derive automatically; run
`pnpm test:run src/cv/export` to confirm the mappers still pass.
````

- [ ] **Step 2: Link the new domain from the project-structure map**

In `README.md`, find the `cv/` block inside the `## Project structure` code fence:

```
├── cv/                           # CV domain — see src/cv/README.md
│   ├── README.md
│   ├── data.ts                   # Source of truth for CV content (RESUME)
```

Add an `export/` entry directly under the `data.ts` line:

```
├── cv/                           # CV domain — see src/cv/README.md
│   ├── README.md
│   ├── data.ts                   # Source of truth for CV content (RESUME)
│   ├── export/                   # Machine-readable exports — see src/cv/export/README.md
```

Then, in the `app/` block of the same fence, add the two new routes under the existing `cv/page.tsx` line:

```
│   ├── cv/page.tsx               # Renders <CVPage />
│   ├── cv/ats/route.ts           # ATS PDF download (/cv/ats)
│   ├── api/cv/json/route.ts      # JSON Resume endpoint (/api/cv/json)
```

- [ ] **Step 3: Update the intro line listing routes**

In `README.md`, the intro paragraph reads:

```
Built with the Next.js App Router. Two routes today: the landing page (`/`) and the web version of the CV (`/cv`). Designed to grow into a small portfolio/blog over time.
```

Replace it with:

```
Built with the Next.js App Router. The landing page (`/`) and the web CV (`/cv`), plus machine-readable exports derived from the same source of truth: a JSON Resume endpoint (`/api/cv/json`) and an ATS PDF (`/cv/ats`). Designed to grow into a small portfolio/blog over time.
```

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test:run`
Expected: PASS — entire suite green (no regressions in existing CV tests).

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/cv/export/README.md README.md
git commit -m "$(cat <<'EOF'
docs(cv): document the machine-readable export domain

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Done criteria

- `pnpm test:run` passes (new mapper, view-model, PDF, and route tests + existing suite).
- `pnpm build` succeeds and lists `/api/cv/json` and `/cv/ats`.
- `GET /api/cv/json` returns a JSON Resume document with `work[].keywords` populated and `Access-Control-Allow-Origin: *`.
- `GET /cv/ats` downloads a single-column, selectable-text PDF.
- `src/cv/export/README.md` documents both endpoints and the consumer join rule; top-level `README.md` links to it.
- All work landed on a feature branch (never `main`); ready to open a PR.
