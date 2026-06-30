// src/seo/og/avatar.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { RESUME } from "@/cv/data";

// Maps an avatar file's extension to its MIME type. Satori (next/og) embeds the
// avatar as a data URI, which must carry the correct media type; anything other
// than png/webp falls back to jpeg, covering the .jpg/.jpeg source we ship.
export function mimeForAvatar(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

// Reads the hero avatar from /public and returns it as a base64 data URI.
// The OG card runs through Satori, which cannot fetch images over HTTP at render
// time, so the bytes are inlined directly into the <img src>.
export async function loadAvatarDataUri(): Promise<string> {
  const avatarPath = RESUME.hero.avatar;
  const bytes = await readFile(join(process.cwd(), "public", avatarPath));
  const mime = mimeForAvatar(avatarPath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
