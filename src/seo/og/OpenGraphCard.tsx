// src/seo/og/OpenGraphCard.tsx
import { ImageResponse } from "next/og";

import { CV_COLORS } from "@/cv/cv-colors";
import { RESUME } from "@/cv/data";

import { loadAvatarDataUri } from "./avatar";
import { OG_SIZE } from "./constants";
import { loadOgFonts } from "./fonts";

export async function renderOpenGraphCard({
  label,
}: {
  label: string;
}): Promise<ImageResponse> {
  const [avatarSrc, fonts] = await Promise.all([
    loadAvatarDataUri(),
    loadOgFonts(),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#ffffff",
        color: CV_COLORS.muted,
        fontFamily: "Spectral",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og (satori) only supports a plain <img> with a data URI; next/image is not supported inside ImageResponse */}
      <img
        src={avatarSrc}
        alt=""
        width={420}
        height={630}
        style={{
          width: 420,
          height: 630,
          objectFit: "cover",
          objectPosition: "top",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          borderLeft: `8px solid ${CV_COLORS.accent}`,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Spectral",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
            color: CV_COLORS.accent,
          }}
        >
          {label.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontFamily: "Spectral",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 1,
            color: CV_COLORS.accent,
          }}
        >
          {RESUME.hero.role.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontFamily: "Domine",
            fontSize: 60,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: -1,
            color: CV_COLORS.foreground,
          }}
        >
          {RESUME.hero.name}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}
