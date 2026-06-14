import type { Metadata } from "next";
import { RESUME } from "@/cv/data";
import { CVPage } from "@/cv/pages/CVPage/CVPage";

export const metadata: Metadata = {
  title: "CV — Leonardo Sarmento de Castro",
  description: RESUME.hero.blurb,
};

export default function CVRoute() {
  return <CVPage />;
}
