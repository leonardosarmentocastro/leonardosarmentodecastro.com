"use client";

import { Marquee } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { RESUME } from "@/cv/data";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import { CompanyLogo } from "@/cv/sections/Work/CompanyLogo";
import type { WorkExperience } from "@/cv/types";

const MARQUEE_LOGO_CLASS = "w-10 h-10";

const LogoButton = ({ entry }: { entry: WorkExperience }) => (
  <button
    type="button"
    aria-label={`View ${entry.company} experience`}
    onClick={() => scrollToWorkEntry(entry)}
    className="flex shrink-0 items-center justify-center rounded-md p-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c78d8]"
  >
    <CompanyLogo company={entry.company} className={MARQUEE_LOGO_CLASS} />
  </button>
);

export const CompanyLogoMarquee = () => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const buttons = RESUME.workExperience.map((entry) => (
    <LogoButton
      key={`${entry.company}-${entry.startDate}`}
      entry={entry}
    />
  ));

  if (reduceMotion) {
    return (
      <div
        data-testid="company-logo-static"
        className="mt-6 flex flex-wrap justify-center gap-4"
      >
        {buttons}
      </div>
    );
  }

  return (
    <div className="mt-6" data-testid="company-logo-marquee">
      <Marquee
        gap="lg"
        pauseOnHover
        fadeEdges
        fadeEdgeColor="white"
        repeat={1}
      >
        {buttons}
      </Marquee>
    </div>
  );
};
