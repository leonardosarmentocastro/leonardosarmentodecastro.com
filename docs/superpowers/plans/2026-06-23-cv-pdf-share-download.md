# CV Recruiter PDF — Shareable Preview + Reliable Download — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-`.pdf` resume link with an HTML page at `/cv/pdf` that unfurls a rich preview card in link crawlers (WhatsApp/Slack) while auto-downloading the PDF for humans, with a visible fallback button.

**Architecture:** `/cv/pdf` is a thin HTML page (`page.tsx`) carrying Open Graph + Twitter metadata, with a colocated `opengraph-image.tsx` that renders a 1200×630 share card via `next/og`. Link crawlers don't run JS, so they receive the HTML + og:image. Real browsers run a client component that auto-triggers a download of `/cv/pdf/download` — a route handler that serves the pre-generated static PDF with `Content-Disposition: attachment` — plus a visible fallback button. The dialog and hero links repoint to `/cv/pdf` via a single `data.ts` change.

**Tech Stack:** Next.js 15.5 App Router, React 19, TypeScript strict, `next/og` (`ImageResponse`), Vitest + Testing Library, pnpm, Biome.

## Global Constraints

- Package manager: **pnpm** only. Tests: `pnpm test:run`. Lint: `pnpm lint`.
- TDD non-negotiable: red → green → refactor. Each commit leaves the repo buildable and tests green.
- **Atomic commits** — one logical change per commit (this plan's tasks already encode that cadence).
- Never commit to `main`; work stays on branch `feat/cv-web-pdf-export`.
- Canonical production host: `https://www.leonardosarmentodecastro.com` (used for `metadataBase`).
- Organize by domain, not layer: CV UI lives under `src/cv/...`; routes under `src/app/cv/...`; tests in colocated `__tests__/` folders.
- Download filename (verbatim, everywhere): `Leonardo-Sarmento-de-Castro-Resume.pdf`.
- Share/preview title (verbatim): `Leonardo Sarmento de Castro — Résumé (PDF)` (em dash `—`, accented `Résumé`).

---

### Task 1: Force-download route `/cv/pdf/download`

Serves the pre-generated static recruiter PDF with attachment disposition. Mirrors `src/app/cv/ats/route.ts`, but reads the committed file instead of rendering.

**Files:**
- Create: `src/app/cv/pdf/download/route.ts`
- Test: `src/app/cv/pdf/download/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `CV_PDF_OUTPUT_FILE` from `src/cv/print/constants.ts` (absolute path to `public/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`).
- Produces: `GET(): Promise<Response>` — `200`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"`, body = the PDF bytes.

- [ ] **Step 1: Write the failing test**

Create `src/app/cv/pdf/download/__tests__/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /cv/pdf/download", () => {
  it("returns the recruiter PDF as a downloadable attachment", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(
      'filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    );
  });

  it("returns real PDF bytes", async () => {
    const res = await GET();
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/app/cv/pdf/download`
Expected: FAIL — cannot resolve `../route` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/cv/pdf/download/route.ts`:

```ts
import { readFile } from "node:fs/promises";

import { CV_PDF_OUTPUT_FILE } from "@/cv/print/constants";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pdf = await readFile(CV_PDF_OUTPUT_FILE);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/app/cv/pdf/download`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/cv/pdf/download/route.ts src/app/cv/pdf/download/__tests__/route.test.ts
git commit -m "feat(cv): serve recruiter PDF as a download attachment at /cv/pdf/download"
```

---

### Task 2: Add `metadataBase` to the root layout

Required so colocated `opengraph-image` URLs resolve to absolute URLs in link previews. The site currently has none.

**Files:**
- Modify: `src/app/layout.tsx:71-74` (the `metadata` export)

**Interfaces:**
- Produces: root `metadata.metadataBase = new URL("https://www.leonardosarmentodecastro.com")`, inherited by every route.

**Testing note (escape hatch):** This is a config change. A unit test would have to import `layout.tsx`, which eagerly evaluates `next/font/google` loaders and `gsap.registerPlugin` at module top level — neither is supported under jsdom/Vitest. Per CLAUDE.md's testing escape hatch, verify via typecheck/build instead of a unit test.

- [ ] **Step 1: Edit the metadata export**

In `src/app/layout.tsx`, change:

```ts
export const metadata: Metadata = {
  title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
  description: "TYPESCRIPT | NODE.JS | REACT | AWS",
};
```

to:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://www.leonardosarmentodecastro.com"),
  title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
  description: "TYPESCRIPT | NODE.JS | REACT | AWS",
};
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): set metadataBase so og:image URLs resolve absolutely"
```

---

### Task 3: Designed Open Graph share card (`opengraph-image.tsx`)

A 1200×630 PNG generated by `next/og`: avatar on the left, name/role/"Résumé (PDF)" on the right, dark brand background. Next auto-wires it as `og:image` and `twitter:image` for `/cv/pdf`.

**Files:**
- Create: `src/app/cv/pdf/opengraph-image.tsx`
- Test: `src/app/cv/pdf/__tests__/opengraph-image.test.ts`

**Interfaces:**
- Consumes: `RESUME.hero.{name,role,avatar}` from `src/cv/data.ts` (`avatar` is `"/leonardo-05.jpg"`).
- Produces: named exports `runtime = "nodejs"`, `alt: string`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, and a default async function returning an `ImageResponse`.

**Testing note:** The test asserts only the static metadata exports (`size`, `alt`, `contentType`). It does **not** invoke the default render: `ImageResponse` pulls in satori/resvg WASM and reads a file from disk — heavy and brittle under jsdom. Correct rendering is verified visually at runtime, not in unit tests.

- [ ] **Step 1: Write the failing test**

Create `src/app/cv/pdf/__tests__/opengraph-image.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "../opengraph-image";

describe("/cv/pdf opengraph-image metadata", () => {
  it("declares the standard 1200x630 OG dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(contentType).toBe("image/png");
  });

  it("has descriptive, resume-flavored alt text", () => {
    expect(alt).toMatch(/résumé/i);
    expect(alt).toMatch(/leonardo/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/app/cv/pdf/__tests__/opengraph-image`
Expected: FAIL — cannot resolve `../opengraph-image`.

- [ ] **Step 3: Write the implementation**

Create `src/app/cv/pdf/opengraph-image.tsx`:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { RESUME } from "@/cv/data";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — Résumé (PDF)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const avatarBytes = await readFile(
    join(process.cwd(), "public", RESUME.hero.avatar),
  );
  const avatarSrc = `data:image/jpeg;base64,${avatarBytes.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#171717",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* avatar */}
      <img
        src={avatarSrc}
        alt=""
        width={420}
        height={630}
        style={{ width: 420, height: 630, objectFit: "cover" }}
      />
      {/* text panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          borderLeft: "8px solid #BB001B",
        }}
      >
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>
          {RESUME.hero.name}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "#d4d4d4" }}>
          {RESUME.hero.role}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 30,
            fontWeight: 700,
            color: "#BB001B",
            letterSpacing: 2,
          }}
        >
          · RÉSUMÉ (PDF) ·
        </div>
      </div>
    </div>,
    { ...size },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/app/cv/pdf/__tests__/opengraph-image`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/cv/pdf/opengraph-image.tsx src/app/cv/pdf/__tests__/opengraph-image.test.ts
git commit -m "feat(cv): designed OG share card for the /cv/pdf resume page"
```

---

### Task 4: `/cv/pdf` HTML page + auto-download client component

The HTML shell crawlers see, plus the client component that auto-downloads for humans with a visible fallback button.

**Files:**
- Create: `src/cv/pages/CvPdfPage/CvPdfDownload.tsx`
- Create: `src/cv/pages/CvPdfPage/__tests__/CvPdfDownload.test.tsx`
- Create: `src/app/cv/pdf/page.tsx`
- Create: `src/app/cv/pdf/__tests__/page.test.ts`

**Interfaces:**
- Consumes: `RESUME.hero.{name,role,blurb}`; the download route `/cv/pdf/download` (Task 1).
- Produces:
  - `CvPdfDownload: () => JSX.Element` — client component; on mount triggers a download of `/cv/pdf/download`; always renders an anchor with accessible name matching `/download pdf/i` whose `href` is `/cv/pdf/download`.
  - `metadata: Metadata` from `page.tsx` with `title === "Leonardo Sarmento de Castro — Résumé (PDF)"`, an `openGraph` object, and `twitter.card === "summary_large_image"`.

- [ ] **Step 1: Write the failing test for the client component**

Create `src/cv/pages/CvPdfPage/__tests__/CvPdfDownload.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/render";
import { CvPdfDownload } from "../CvPdfDownload";

describe("CvPdfDownload", () => {
  it("renders a visible fallback link to the download route", () => {
    renderWithProviders(<CvPdfDownload />);
    const link = screen.getByRole("link", { name: /download pdf/i });
    expect(link).toHaveAttribute("href", "/cv/pdf/download");
  });

  it("tells the visitor the download starts automatically", () => {
    renderWithProviders(<CvPdfDownload />);
    expect(screen.getByText(/start(s)? automatically/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/cv/pages/CvPdfPage`
Expected: FAIL — cannot resolve `../CvPdfDownload`.

- [ ] **Step 3: Write the client component**

Create `src/cv/pages/CvPdfPage/CvPdfDownload.tsx`:

```tsx
"use client";

import { useEffect } from "react";

import { RESUME } from "@/cv/data";

const DOWNLOAD_URL = "/cv/pdf/download";
const FILENAME = "Leonardo-Sarmento-de-Castro-Resume.pdf";

export const CvPdfDownload = () => {
  useEffect(() => {
    const anchor = document.createElement("a");
    anchor.href = DOWNLOAD_URL;
    anchor.download = FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-[16px] px-6 text-center bg-[#171717] text-white">
      <h1 className="font-jakarta-sans text-[24px] md:text-[32px] font-black">
        {RESUME.hero.name} — Résumé
      </h1>
      <p className="font-jakarta-sans text-[14px] md:text-[16px] text-neutral-300 max-w-[420px]">
        Your download starts automatically. If it doesn&apos;t, tap below.
      </p>
      <a
        href={DOWNLOAD_URL}
        download={FILENAME}
        className="font-jakarta-sans font-bold text-[16px] rounded-[20px] px-[30px] py-[15px] bg-[#BB001B] text-white hover:scale-[1.02] transition-transform"
      >
        Download PDF
      </a>
    </main>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/cv/pages/CvPdfPage`
Expected: PASS (2 tests). (jsdom logs a "Not implemented: navigation" notice from the programmatic `anchor.click()` — this is expected and does not fail the test.)

- [ ] **Step 5: Write the failing test for the page metadata**

Create `src/app/cv/pdf/__tests__/page.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { metadata } from "../page";

describe("/cv/pdf page metadata", () => {
  it("uses the canonical résumé share title", () => {
    expect(metadata.title).toBe("Leonardo Sarmento de Castro — Résumé (PDF)");
  });

  it("declares Open Graph metadata", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBe(
      "Leonardo Sarmento de Castro — Résumé (PDF)",
    );
  });

  it("uses a large-image Twitter card", () => {
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm test:run src/app/cv/pdf/__tests__/page`
Expected: FAIL — cannot resolve `../page`.

- [ ] **Step 7: Write the page**

Create `src/app/cv/pdf/page.tsx`:

```tsx
import type { Metadata } from "next";

import { RESUME } from "@/cv/data";
import { CvPdfDownload } from "@/cv/pages/CvPdfPage/CvPdfDownload";

const TITLE = "Leonardo Sarmento de Castro — Résumé (PDF)";

export const metadata: Metadata = {
  title: TITLE,
  description: RESUME.hero.blurb,
  openGraph: {
    title: TITLE,
    description: RESUME.hero.blurb,
    url: "/cv/pdf",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: RESUME.hero.blurb,
  },
};

export default function CvPdfRoute() {
  return <CvPdfDownload />;
}
```

- [ ] **Step 8: Run both /cv/pdf test files to verify they pass**

Run: `pnpm test:run src/app/cv/pdf src/cv/pages/CvPdfPage`
Expected: PASS (all tests across page + opengraph-image + CvPdfDownload).

- [ ] **Step 9: Commit**

```bash
git add src/cv/pages/CvPdfPage src/app/cv/pdf/page.tsx src/app/cv/pdf/__tests__/page.test.ts
git commit -m "feat(cv): /cv/pdf page that previews on share and auto-downloads for humans"
```

---

### Task 5: Repoint the resume link to `/cv/pdf`

One `data.ts` change repoints both consumers (the dialog descriptor and the hero button). Update the two existing `data.test.ts` assertions that pin the old static path.

**Files:**
- Modify: `src/cv/data.ts:23` (the `resumePdf` link)
- Modify: `src/cv/__tests__/data.test.ts:41,44-47` (two assertions on `resumePdf`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `RESUME.hero.links.resumePdf === "/cv/pdf"`. Downstream `ResumeOptionsModal` (`recruiterPdf` descriptor) and `Hero.tsx:130` now point at the new page with no further edits.

- [ ] **Step 1: Update the failing assertions first (red)**

In `src/cv/__tests__/data.test.ts`, replace the two existing `resumePdf` assertions.

Change the line in the "exposes every link consumers need" test:

```ts
    expect(links.resumePdf).toBe("/cv/Leonardo-Sarmento-de-Castro-Resume.pdf");
```

to:

```ts
    expect(links.resumePdf).toBe("/cv/pdf");
```

And replace the whole `"links the recruiter PDF to the generated local asset (not Google Drive)"` test with:

```ts
  it("points the recruiter resume link at the shareable /cv/pdf page", () => {
    expect(RESUME.hero.links.resumePdf).toBe("/cv/pdf");
  });
```

- [ ] **Step 2: Run the data test to verify it fails**

Run: `pnpm test:run src/cv/__tests__/data.test.ts`
Expected: FAIL — `resumePdf` is still `/cv/Leonardo-Sarmento-de-Castro-Resume.pdf`.

- [ ] **Step 3: Repoint the link (green)**

In `src/cv/data.ts`, change:

```ts
      resumePdf: "/cv/Leonardo-Sarmento-de-Castro-Resume.pdf",
```

to:

```ts
      resumePdf: "/cv/pdf",
```

- [ ] **Step 4: Run the data + modal tests to verify they pass**

Run: `pnpm test:run src/cv/__tests__/data.test.ts src/cv/__tests__/ResumeOptionsModal.test.tsx`
Expected: PASS. (`ResumeOptionsModal.test.tsx` reads `RESUME.hero.links.resumePdf` dynamically, so it stays green and now asserts the link resolves to `/cv/pdf`.)

- [ ] **Step 5: Commit**

```bash
git add src/cv/data.ts src/cv/__tests__/data.test.ts
git commit -m "feat(cv): point recruiter resume link at the shareable /cv/pdf page"
```

---

### Task 6: Document the new surface

Record `/cv/pdf` and `/cv/pdf/download` in the CV export README so the surface map stays accurate (per CLAUDE.md: docs updated in the same change set).

**Files:**
- Modify: `src/cv/export/README.md` (the "Endpoints" table + a short note)

**Interfaces:** none (documentation only).

- [ ] **Step 1: Add the new rows/note to the README**

In `src/cv/export/README.md`, under the "Endpoints" table, add rows describing the two new surfaces. Add after the existing `/cv/ats` row:

```markdown
| `/cv/pdf` | HTML share page: renders an Open Graph card for link previews, then auto-downloads the recruiter PDF (fallback button for humans). | — (links to the recruiter PDF) | recruiters / link-sharing (WhatsApp, Slack) |
| `/cv/pdf/download` | The recruiter PDF served as a `Content-Disposition: attachment` download (reads the pre-generated `public/cv` asset). | `readFile(CV_PDF_OUTPUT_FILE)` | the `/cv/pdf` page's download trigger |
```

Then add a short paragraph below the table:

```markdown
`/cv/pdf` is the link to share with people: link crawlers don't run JS, so they
receive the HTML + the 1200×630 `opengraph-image.tsx` card, while real browsers
run the client component that auto-downloads `/cv/pdf/download`. The raw asset at
`CV_PDF_PUBLIC_PATH` stays the generator's output, but `/cv/pdf` is now the
public-facing entry point (`RESUME.hero.links.resumePdf`).
```

- [ ] **Step 2: Verify the doc reads correctly**

Run: `pnpm lint`
Expected: no errors (Biome may format Markdown tables; accept its output).

- [ ] **Step 3: Commit**

```bash
git add src/cv/export/README.md
git commit -m "docs(cv): document the /cv/pdf share + download surfaces"
```

---

### Task 7: Full-suite verification

Confirm the whole feature is green and the build is clean before review.

**Files:** none.

- [ ] **Step 1: Run the entire test suite**

Run: `pnpm test:run`
Expected: PASS — all suites, including the new `/cv/pdf` route, opengraph-image, page, CvPdfDownload, and the updated data/modal tests.

- [ ] **Step 2: Typecheck and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both exit 0.

- [ ] **Step 3: Production build (verifies the OG image + page compile under Next)**

Run: `pnpm build`
Expected: build succeeds; `/cv/pdf` and `/cv/pdf/download` appear in the route output.

---

## Self-Review

**Spec coverage:**
- HTML page at `/cv/pdf` with OG/Twitter metadata → Task 4. ✓
- Designed 1200×630 share card (`opengraph-image.tsx`) → Task 3. ✓
- `/cv/pdf/download` route, attachment disposition reading the static asset → Task 1. ✓
- Auto-download + visible fallback button client component → Task 4. ✓
- Repoint `RESUME.hero.links.resumePdf` (covers dialog + hero) → Task 5. ✓
- `metadataBase` added site-wide → Task 2. ✓
- Untouched: `/cv/ats`, `/api/cv/json`, generator script, `/cv` page → no tasks modify them. ✓
- Docs updated in the same change set → Task 6. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every command has expected output. ✓

**Type consistency:** `DOWNLOAD_URL`/filename strings match between the route (Task 1), the client component, and the page (Task 4); `size`/`alt`/`contentType` names match between `opengraph-image.tsx` and its test (Task 3); `resumePdf === "/cv/pdf"` is consistent across Tasks 4–5 and the README (Task 6). ✓
