# `/cv` Social-Share Thumbnail Fix + Canonical Host Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/cv` (and every other route) advertise a branded Open Graph share card so LinkedIn shows the CV portrait + presentation text instead of the Pinterest work-experience logo, and align the project's SEO surfaces to the new canonical host.

**Architecture:** A new `src/og/` domain owns a parameterized share-card renderer (`renderOgCard`) plus its avatar/constants helpers and a single `CANONICAL_ORIGIN` constant. Next.js file-convention `opengraph-image.tsx` routes at the app root and under `/cv` call the renderer; `layout.tsx` sets `metadataBase` + default OG/Twitter metadata; `/cv/page.tsx` adds its own OG/Twitter metadata. `robots.ts` and `sitemap.ts` consume `CANONICAL_ORIGIN`; `data.ts`'s hero `site` link is updated to the canonical host.

**Tech Stack:** Next.js 15.5.9 (App Router, `next/og` `ImageResponse`), React 19, TypeScript (strict), Vitest, Biome, pnpm.

## Global Constraints

- Package manager: **pnpm** only. Test: `pnpm test:run <path>`. Lint: `pnpm lint`.
- Canonical host (verbatim): `https://leonardosarmentocastro.com` (apex, no `www`).
- Accent line on every card (verbatim): `RESUME.hero.kicker` → `"AI-assisted · TypeScript · Node.js · React · AWS"`.
- OG card dimensions (verbatim): `{ width: 1200, height: 630 }`, content type `image/png`.
- Path alias: `@/*` → `src/*`.
- Domain organization: feature/domain folders; tests colocated in `__tests__/`.
- `next/og` (satori) accepts only a plain `<img>` with a data URI — never `next/image` inside `ImageResponse`. Suppress Biome's `lint/performance/noImgElement` with a `biome-ignore` comment on that `<img>`.
- Commit message style: Conventional Commits (`feat(scope): …`, `fix(scope): …`, `chore(scope): …`), matching the repo log.
- Branch: `fix/cv-opengraph-image` (already created off `main`). Never commit to `main`.
- **Out of scope:** analytics canonical migration (`src/analytics/*`), `/cv/pdf`, the Vercel redirect config.

---

### Task 1: `src/og/` share-card renderer (constants + avatar + card)

Establishes the OG domain: dimension constants, the avatar-to-data-URI loader (with a pure MIME helper), and the parameterized card renderer. One commit.

**Files:**
- Create: `src/og/constants.ts`
- Create: `src/og/avatar.ts`
- Create: `src/og/card.tsx`
- Test: `src/og/__tests__/constants.test.ts`
- Test: `src/og/__tests__/avatar.test.ts`

**Interfaces:**
- Produces:
  - `OG_SIZE: { width: 1200; height: 630 }`, `OG_CONTENT_TYPE: "image/png"` (from `constants.ts`)
  - `mimeForAvatar(path: string): string` and `loadAvatarDataUri(): Promise<string>` (from `avatar.ts`)
  - `renderOgCard({ label }: { label: string }): Promise<ImageResponse>` (from `card.tsx`)
- Consumes: `RESUME` from `@/cv/data` (`hero.name`, `hero.role`, `hero.avatar`).

**Note on testing the card render:** `renderOgCard` builds a `next/og` `ImageResponse` (satori + WASM). The repo's established convention does **not** render OG images in unit tests — it tests the metadata exports (`alt`/`size`/`contentType`) on the route files (Task 3/4) and the pure logic (`mimeForAvatar`). Rendering satori under Vitest is test-runner-infra-fragile (font/WASM loading), so per the escape hatch we verify the actual pixels via `pnpm build` + a dev-server view in Task 7 rather than a unit test. `card.tsx`'s only branching logic (MIME) lives in the separately-tested `mimeForAvatar`.

- [ ] **Step 1: Write the failing test for constants**

```ts
// src/og/__tests__/constants.test.ts
import { describe, expect, it } from "vitest";

import { OG_CONTENT_TYPE, OG_SIZE } from "../constants";

describe("og constants", () => {
  it("uses the standard 1200x630 OG size", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(OG_CONTENT_TYPE).toBe("image/png");
  });
});
```

- [ ] **Step 2: Write the failing test for the avatar helpers**

```ts
// src/og/__tests__/avatar.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from("fake-image-bytes")),
}));

import { loadAvatarDataUri, mimeForAvatar } from "../avatar";

describe("mimeForAvatar", () => {
  it("maps .png to image/png", () => {
    expect(mimeForAvatar("/a/b.png")).toBe("image/png");
  });

  it("maps .webp to image/webp", () => {
    expect(mimeForAvatar("/a/b.webp")).toBe("image/webp");
  });

  it("falls back to image/jpeg for .jpg/.jpeg/unknown", () => {
    expect(mimeForAvatar("/a/b.jpg")).toBe("image/jpeg");
    expect(mimeForAvatar("/a/b.jpeg")).toBe("image/jpeg");
    expect(mimeForAvatar("/a/b")).toBe("image/jpeg");
  });
});

describe("loadAvatarDataUri", () => {
  it("returns a base64 image data URI", async () => {
    const uri = await loadAvatarDataUri();
    expect(uri).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
    expect(uri.length).toBeGreaterThan("data:image/jpeg;base64,".length);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test:run src/og`
Expected: FAIL — cannot resolve `../constants` / `../avatar` (modules not created yet).

- [ ] **Step 4: Implement `src/og/constants.ts`**

```ts
// src/og/constants.ts
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";
```

- [ ] **Step 5: Implement `src/og/avatar.ts`**

```ts
// src/og/avatar.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { RESUME } from "@/cv/data";

export function mimeForAvatar(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export async function loadAvatarDataUri(): Promise<string> {
  const avatarPath = RESUME.hero.avatar;
  const bytes = await readFile(join(process.cwd(), "public", avatarPath));
  const mime = mimeForAvatar(avatarPath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
```

- [ ] **Step 6: Implement `src/og/card.tsx`**

```tsx
// src/og/card.tsx
import { ImageResponse } from "next/og";

import { RESUME } from "@/cv/data";

import { loadAvatarDataUri } from "./avatar";
import { OG_SIZE } from "./constants";

export async function renderOgCard({
  label,
}: {
  label: string;
}): Promise<ImageResponse> {
  const avatarSrc = await loadAvatarDataUri();

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
      {/* biome-ignore lint/performance/noImgElement: next/og (satori) only supports a plain <img> with a data URI; next/image is not supported inside ImageResponse */}
      <img
        src={avatarSrc}
        alt=""
        width={420}
        height={630}
        style={{ width: 420, height: 630, objectFit: "cover" }}
      />
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
            fontSize: 28,
            fontWeight: 700,
            color: "#BB001B",
            letterSpacing: 1,
          }}
        >
          {label}
        </div>
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm test:run src/og`
Expected: PASS (constants + avatar suites green).

- [ ] **Step 8: Lint**

Run: `pnpm lint`
Expected: clean (the `<img>` is covered by the `biome-ignore` comment).

- [ ] **Step 9: Commit**

```bash
git add src/og/constants.ts src/og/avatar.ts src/og/card.tsx src/og/__tests__/constants.test.ts src/og/__tests__/avatar.test.ts
git commit -m "feat(og): shared branded OG share-card renderer in src/og/"
```

---

### Task 2: Canonical origin constant + root layout metadata

Introduces `CANONICAL_ORIGIN` (single source of truth for the canonical host) and wires `layout.tsx` with `metadataBase` + default Open Graph / Twitter metadata so every route advertises an absolute-URL share image.

**Files:**
- Create: `src/og/site.ts`
- Test: `src/og/__tests__/site.test.ts`
- Modify: `src/app/layout.tsx:71-74` (the `metadata` export)

**Interfaces:**
- Produces: `CANONICAL_ORIGIN: "https://leonardosarmentocastro.com"` (from `site.ts`).
- Consumes: `CANONICAL_ORIGIN` in `layout.tsx`.

**Note:** `layout.tsx` imports `next/font/google`, which does not load under Vitest, so the layout's `metadata` object is not unit-tested (test-runner-infra limitation — escape hatch). Its correctness is verified by `pnpm build` + dev-server inspection in Task 7. The canonical host value it depends on **is** unit-tested here via `CANONICAL_ORIGIN`.

- [ ] **Step 1: Write the failing test for the canonical origin**

```ts
// src/og/__tests__/site.test.ts
import { describe, expect, it } from "vitest";

import { CANONICAL_ORIGIN } from "../site";

describe("CANONICAL_ORIGIN", () => {
  it("is the apex leonardosarmentocastro.com over https, with no trailing slash", () => {
    expect(CANONICAL_ORIGIN).toBe("https://leonardosarmentocastro.com");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/og/__tests__/site.test.ts`
Expected: FAIL — cannot resolve `../site`.

- [ ] **Step 3: Implement `src/og/site.ts`**

```ts
// src/og/site.ts
export const CANONICAL_ORIGIN = "https://leonardosarmentocastro.com";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/og/__tests__/site.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `metadataBase` + default OG/Twitter into `layout.tsx`**

Add the import near the other `@/` imports at the top of `src/app/layout.tsx`:

```tsx
import { CANONICAL_ORIGIN } from "@/og/site";
```

Replace the existing `metadata` export (currently lines 71-74):

```tsx
export const metadata: Metadata = {
  title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
  description: "TYPESCRIPT | NODE.JS | REACT | AWS",
};
```

with:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
  description: "TYPESCRIPT | NODE.JS | REACT | AWS",
  openGraph: {
    title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
    description: "TYPESCRIPT | NODE.JS | REACT | AWS",
    url: "/",
    siteName: "Leonardo Sarmento de Castro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonardo Sarmento de Castro | SENIOR SOFTWARE ENGINEER",
    description: "TYPESCRIPT | NODE.JS | REACT | AWS",
  },
};
```

- [ ] **Step 6: Run the og test suite + lint**

Run: `pnpm test:run src/og && pnpm lint`
Expected: PASS, lint clean.

- [ ] **Step 7: Commit**

```bash
git add src/og/site.ts src/og/__tests__/site.test.ts src/app/layout.tsx
git commit -m "feat(seo): set metadataBase + default Open Graph metadata on the canonical host"
```

---

### Task 3: Site-wide default `opengraph-image`

Adds the app-root `opengraph-image.tsx` so `/` and any route without a more specific image get the branded default card.

**Files:**
- Create: `src/app/opengraph-image.tsx`
- Test: `src/app/__tests__/opengraph-image.test.ts`

**Interfaces:**
- Consumes: `renderOgCard` (`@/og/card`), `OG_SIZE`/`OG_CONTENT_TYPE` (`@/og/constants`), `RESUME` (`@/cv/data`).
- Produces (route exports read by Next + the test): `alt: string`, `size`, `contentType`, default `Image()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/__tests__/opengraph-image.test.ts
import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "../opengraph-image";

describe("root opengraph-image metadata", () => {
  it("declares the standard 1200x630 OG dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(contentType).toBe("image/png");
  });

  it("has descriptive alt text naming Leonardo and the role", () => {
    expect(alt).toMatch(/leonardo/i);
    expect(alt).toMatch(/engineer/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/app/__tests__/opengraph-image.test.ts`
Expected: FAIL — cannot resolve `../opengraph-image`.

- [ ] **Step 3: Implement `src/app/opengraph-image.tsx`**

```tsx
// src/app/opengraph-image.tsx
import { RESUME } from "@/cv/data";
import { renderOgCard } from "@/og/card";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/og/constants";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — Senior Software Engineer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({ label: RESUME.hero.kicker });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/app/__tests__/opengraph-image.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/opengraph-image.tsx src/app/__tests__/opengraph-image.test.ts
git commit -m "feat(og): site-wide default opengraph-image"
```

---

### Task 4: `/cv` `opengraph-image` + page Open Graph metadata

The actual bug fix: gives `/cv` its own branded card and Open Graph / Twitter metadata so LinkedIn stops grabbing the Pinterest logo.

**Files:**
- Create: `src/app/cv/opengraph-image.tsx`
- Test: `src/app/cv/__tests__/opengraph-image.test.ts`
- Modify: `src/app/cv/page.tsx:5-8` (the `metadata` export)
- Test: `src/app/cv/__tests__/page.test.ts`

**Interfaces:**
- Consumes: `renderOgCard` (`@/og/card`), `OG_SIZE`/`OG_CONTENT_TYPE` (`@/og/constants`), `RESUME` (`@/cv/data`).
- Produces: `/cv` route image exports (`alt`/`size`/`contentType`/`Image`) + the page `metadata` with `openGraph` and `twitter`.

- [ ] **Step 1: Write the failing test for the `/cv` opengraph-image**

```ts
// src/app/cv/__tests__/opengraph-image.test.ts
import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "../opengraph-image";

describe("/cv opengraph-image metadata", () => {
  it("declares the standard 1200x630 OG dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares a PNG content type", () => {
    expect(contentType).toBe("image/png");
  });

  it("has CV-flavored alt text naming Leonardo", () => {
    expect(alt).toMatch(/leonardo/i);
    expect(alt).toMatch(/cv/i);
  });
});
```

- [ ] **Step 2: Write the failing test for the `/cv` page metadata**

```ts
// src/app/cv/__tests__/page.test.ts
import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";

import { metadata } from "../page";

describe("/cv page metadata", () => {
  it("declares Open Graph pointing at /cv with the hero blurb", () => {
    expect(metadata.openGraph?.url).toBe("/cv");
    expect(metadata.openGraph?.description).toBe(RESUME.hero.blurb);
    expect(metadata.openGraph?.title).toBeTruthy();
  });

  it("uses a large-image Twitter card", () => {
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });
});
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `pnpm test:run src/app/cv/__tests__/opengraph-image.test.ts src/app/cv/__tests__/page.test.ts`
Expected: FAIL — `../opengraph-image` unresolved; `metadata.openGraph` is `undefined`.

- [ ] **Step 4: Implement `src/app/cv/opengraph-image.tsx`**

```tsx
// src/app/cv/opengraph-image.tsx
import { RESUME } from "@/cv/data";
import { renderOgCard } from "@/og/card";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/og/constants";

export const runtime = "nodejs";

export const alt = "Leonardo Sarmento de Castro — CV";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({ label: RESUME.hero.kicker });
}
```

- [ ] **Step 5: Add Open Graph / Twitter metadata to `src/app/cv/page.tsx`**

Replace the existing `metadata` export (currently lines 5-8):

```tsx
export const metadata: Metadata = {
  title: "CV — Leonardo Sarmento de Castro",
  description: RESUME.hero.blurb,
};
```

with:

```tsx
const TITLE = "CV — Leonardo Sarmento de Castro";

export const metadata: Metadata = {
  title: TITLE,
  description: RESUME.hero.blurb,
  openGraph: {
    title: TITLE,
    description: RESUME.hero.blurb,
    url: "/cv",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: RESUME.hero.blurb,
  },
};
```

- [ ] **Step 6: Run both tests to verify they pass**

Run: `pnpm test:run src/app/cv/__tests__/opengraph-image.test.ts src/app/cv/__tests__/page.test.ts`
Expected: PASS.

- [ ] **Step 7: Lint**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/app/cv/opengraph-image.tsx src/app/cv/page.tsx src/app/cv/__tests__/opengraph-image.test.ts src/app/cv/__tests__/page.test.ts
git commit -m "fix(cv): add /cv opengraph-image and Open Graph metadata so shares stop grabbing the Pinterest logo"
```

---

### Task 5: Point `robots.ts` at the canonical host

**Files:**
- Modify: `src/app/robots.ts:10`
- Test: `src/app/__tests__/robots.test.ts`

**Interfaces:**
- Consumes: `CANONICAL_ORIGIN` (`@/og/site`).

- [ ] **Step 1: Write the failing test**

```ts
// src/app/__tests__/robots.test.ts
import { describe, expect, it } from "vitest";

import robots from "../robots";

describe("robots", () => {
  it("points the sitemap at the canonical host", () => {
    expect(robots().sitemap).toBe(
      "https://leonardosarmentocastro.com/sitemap.xml",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/app/__tests__/robots.test.ts`
Expected: FAIL — sitemap is `https://leonardosarmentodecastro.com/sitemap.xml`.

- [ ] **Step 3: Implement the change**

Edit `src/app/robots.ts` to import the constant and use it:

```ts
import type { MetadataRoute } from "next";

import { CANONICAL_ORIGIN } from "@/og/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/app/__tests__/robots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts src/app/__tests__/robots.test.ts
git commit -m "chore(seo): point robots sitemap at the canonical host"
```

---

### Task 6: Emit only the canonical host in `sitemap.ts`

**Files:**
- Modify: `src/app/sitemap.ts`
- Test: `src/app/__tests__/sitemap.test.ts`

**Interfaces:**
- Consumes: `CANONICAL_ORIGIN` (`@/og/site`).

- [ ] **Step 1: Write the failing test**

```ts
// src/app/__tests__/sitemap.test.ts
import { describe, expect, it } from "vitest";

import sitemap from "../sitemap";

describe("sitemap", () => {
  it("emits only canonical-host URLs (no leonardosarmentodecastro.com)", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const url of urls) {
      expect(url.startsWith("https://leonardosarmentocastro.com")).toBe(true);
    }
    expect(urls.some((url) => url.includes("leonardosarmentodecastro.com"))).toBe(
      false,
    );
  });

  it("includes the home and CV routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://leonardosarmentocastro.com/");
    expect(urls).toContain("https://leonardosarmentocastro.com/cv");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/app/__tests__/sitemap.test.ts`
Expected: FAIL — sitemap currently also emits `https://leonardosarmentodecastro.com/...` entries.

- [ ] **Step 3: Implement the change**

Replace the full contents of `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

import { CANONICAL_ORIGIN } from "@/og/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${CANONICAL_ORIGIN}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${CANONICAL_ORIGIN}/cv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/app/__tests__/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts src/app/__tests__/sitemap.test.ts
git commit -m "chore(seo): emit only the canonical host in sitemap"
```

---

### Task 7: Point the hero `site` link at the canonical host + full verification

Updates the content-layer `site` link (kept as a plain literal — the content layer does not depend on the `og` domain) and performs end-to-end verification.

**Files:**
- Modify: `src/cv/data.ts:22`
- Test: `src/cv/__tests__/data.test.ts:32-42` (tighten the `site` assertion)

- [ ] **Step 1: Tighten the failing test for the `site` link**

In `src/cv/__tests__/data.test.ts`, inside the `"exposes every link consumers need"` test, replace the generic site assertion:

```ts
    expect(links.site).toMatch(/^https:\/\//);
```

with the canonical-host assertion:

```ts
    expect(links.site).toBe("https://leonardosarmentocastro.com");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/cv/__tests__/data.test.ts`
Expected: FAIL — `links.site` is currently `https://www.leonardosarmentodecastro.com`.

- [ ] **Step 3: Implement the change**

In `src/cv/data.ts`, change line 22:

```ts
      site: "https://www.leonardosarmentodecastro.com",
```

to:

```ts
      site: "https://leonardosarmentocastro.com",
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/cv/__tests__/data.test.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + lint + build**

Run: `pnpm test:run`
Expected: all suites PASS.

Run: `pnpm lint`
Expected: clean.

Run: `pnpm build`
Expected: build succeeds; the build output lists the generated `opengraph-image` routes for `/` and `/cv` (no errors compiling the `ImageResponse` routes or the metadata).

- [ ] **Step 6: Manual OG verification on the dev server**

Run: `pnpm dev` (background), then in another shell:

```bash
curl -s http://localhost:3000/cv | grep -Eo '<meta (property="og:[^"]*"|name="twitter:[^"]*")[^>]*>'
```

Expected: `og:image` present and pointing at an absolute `https://leonardosarmentocastro.com/cv/opengraph-image...` URL; `og:title`/`og:description` present; `twitter:card` is `summary_large_image`.

Open `http://localhost:3000/cv/opengraph-image` and `http://localhost:3000/opengraph-image` in a browser — confirm both render the branded card (portrait + name + role + kicker accent line), **not** the Pinterest logo. Stop the dev server when done.

- [ ] **Step 7: Commit**

```bash
git add src/cv/data.ts src/cv/__tests__/data.test.ts
git commit -m "chore(cv): point hero site link at the canonical host"
```

---

## Post-merge (operational, not code)

After this branch is merged and Vercel deploys:

1. Confirm the Vercel redirect `leonardosarmentodecastro.com` → `leonardosarmentocastro.com` is configured.
2. Re-scrape `https://leonardosarmentocastro.com/cv` in the
   [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to flush LinkedIn's
   ~7-day cache holding the stale Pinterest thumbnail. Do the same for `/`.

## Self-Review

- **Spec coverage:** `src/og/` domain (Task 1) ✓; `metadataBase` + default OG (Task 2) ✓;
  root default `opengraph-image` (Task 3) ✓; `/cv` `opengraph-image` + page metadata —
  the reported bug (Task 4) ✓; `robots.ts` canonical (Task 5) ✓; `sitemap.ts` canonical
  single-host (Task 6) ✓; `data.ts` site link (Task 7) ✓; analytics explicitly out of scope ✓;
  post-deploy LinkedIn re-scrape captured ✓. The only spec deviation is the `CANONICAL_ORIGIN`
  constant in `src/og/site.ts` replacing the spec's inline `new URL(...)` — a DRY refinement
  consumed by layout/robots/sitemap, flagged here for visibility.
- **Type/name consistency:** `renderOgCard({ label })`, `loadAvatarDataUri()`, `mimeForAvatar()`,
  `OG_SIZE`, `OG_CONTENT_TYPE`, and `CANONICAL_ORIGIN` are used with identical signatures in
  every consuming task.
- **Placeholders:** none — every code and test step contains complete content.
