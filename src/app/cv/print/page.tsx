import type { Metadata } from "next";

import { CVPrintPage } from "@/cv/print/CVPrintPage";

export const metadata: Metadata = {
  title: "Leonardo Sarmento de Castro — CV (print)",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CVPrintPage />;
}
