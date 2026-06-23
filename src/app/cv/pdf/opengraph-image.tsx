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
  const ext = RESUME.hero.avatar.split(".").pop()?.toLowerCase();
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const avatarSrc = `data:${mime};base64,${avatarBytes.toString("base64")}`;

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
      {/* biome-ignore lint/performance/noImgElement: next/og (satori) only supports a plain <img> with a data URI; next/image is not supported inside ImageResponse */}
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
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          {RESUME.hero.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 34,
            color: "#d4d4d4",
          }}
        >
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
