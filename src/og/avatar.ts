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
