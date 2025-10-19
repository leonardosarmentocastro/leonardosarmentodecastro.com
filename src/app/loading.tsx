"use client";

import Head from "next/head";

import { LANDING_PAGE_COVER_IMAGES } from "@/components/pages/LandingPage/CoverImagesLoop/constants";

export default function Loading() {
  return (
    <Head>
      {/* Preload landing page cover images */}
      {LANDING_PAGE_COVER_IMAGES.map((image) => (
        <link key={image.src} rel="preload" href={image.src} as="image" />
      ))}
    </Head>
  );
}
