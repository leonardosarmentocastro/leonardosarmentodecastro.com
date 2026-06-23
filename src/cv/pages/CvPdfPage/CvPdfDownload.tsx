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
