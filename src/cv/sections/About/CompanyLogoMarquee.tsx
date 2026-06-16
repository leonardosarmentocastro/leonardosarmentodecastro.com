"use client";

import { useMediaQuery } from "@mantine/hooks";

import { Marquee } from "@/components/ui/marquee";
import { RESUME } from "@/cv/data";
import { scrollToWorkEntry } from "@/cv/sections/Work/anchors";
import { CompanyLogo } from "@/cv/sections/Work/CompanyLogo";
import type { WorkExperience } from "@/cv/types";

const MARQUEE_LOGO_CLASS = "w-10 h-10";
const MARQUEE_REPEAT = 4;

const LogoButton = ({ entry }: { entry: WorkExperience }) => (
  <button
    type="button"
    aria-label={`View ${entry.company} experience`}
    onClick={() => scrollToWorkEntry(entry)}
    className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c78d8]"
  >
    <CompanyLogo company={entry.company} className={MARQUEE_LOGO_CLASS} />
  </button>
);

export const CompanyLogoMarquee = () => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const buttons = RESUME.workExperience.map((entry) => (
    <LogoButton key={`${entry.company}-${entry.startDate}`} entry={entry} />
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
    <div
      className="relative mt-6 overflow-hidden"
      data-testid="company-logo-marquee"
    >
      <Marquee pauseOnHover repeat={MARQUEE_REPEAT} className="[--gap:1.5rem]" reverse>
        {buttons}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
};
