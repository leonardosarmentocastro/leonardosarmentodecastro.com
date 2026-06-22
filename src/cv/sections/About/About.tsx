"use client";

import { RESUME } from "@/cv/data";

import { CompanyLogoMarquee } from "./CompanyLogoMarquee";

export const About = ({ printMode = false }: { printMode?: boolean }) => (
  <section id="about" className="flex flex-col gap-3">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">About</h2>
    {RESUME.about.map((paragraph) => (
      <p
        key={paragraph}
        className="text-sm font-quicksand text-[#6d6964] leading-relaxed"
      >
        {paragraph}
      </p>
    ))}
    {printMode ? (
      <CompanyLogoMarquee forceStatic limit={5} />
    ) : (
      <CompanyLogoMarquee />
    )}
  </section>
);
