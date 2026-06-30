import type { Metadata } from "next";
import { RESUME } from "@/cv/data";
import { CVPage } from "@/cv/pages/CVPage/CVPage";

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

export default function CVRoute() {
  return <CVPage />;
}
