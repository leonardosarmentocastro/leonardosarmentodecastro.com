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
