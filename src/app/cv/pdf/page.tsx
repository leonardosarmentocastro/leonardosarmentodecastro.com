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
