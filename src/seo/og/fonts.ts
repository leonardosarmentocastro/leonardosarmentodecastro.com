// src/seo/og/fonts.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ImageResponse } from "next/og";

type OgFont = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>[number];

// The CV header renders the name in Domine (serif) and the kicker/role in
// Spectral. Those come from next/font/google, which Satori (next/og) can't read,
// so the matching .ttf files are bundled here and loaded at render time. The OG
// routes are statically prerendered at build, when the source tree is present.
const FONT_DIR = join(process.cwd(), "src/seo/og/fonts");

export async function loadOgFonts(): Promise<OgFont[]> {
  const [domine, spectral] = await Promise.all([
    readFile(join(FONT_DIR, "Domine-Regular.ttf")),
    readFile(join(FONT_DIR, "Spectral-Bold.ttf")),
  ]);

  return [
    { name: "Domine", data: domine, weight: 400, style: "normal" },
    { name: "Spectral", data: spectral, weight: 700, style: "normal" },
  ];
}
