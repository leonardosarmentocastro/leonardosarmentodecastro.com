import type { Metadata } from "next";

import { CVPage } from "@/components/pages/CVPage/CVPage";
import { RESUME } from "@/cv/data";

export const metadata: Metadata = {
  title: "CV — Leonardo Sarmento de Castro",
  description: RESUME.hero.blurb,
};

export default function CVRoute() {
  return <CVPage />;
}
