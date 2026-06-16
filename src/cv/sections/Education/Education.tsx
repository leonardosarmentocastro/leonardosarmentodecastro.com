"use client";

import { RESUME } from "@/cv/data";

export const Education = () => (
  <section id="education" className="flex flex-col gap-4">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
      Education
    </h2>
    <div className="flex flex-col gap-4">
      {RESUME.education.map((e) => (
        <article key={e.school} className="flex flex-col gap-1">
          <header className="flex flex-row justify-between items-baseline gap-4">
            <h3 className="text-base font-quicksand font-bold text-[#2d2a24]">
              {e.school}
            </h3>
            <span className="text-xs text-[#6c6965] whitespace-nowrap">
              {e.period}
            </span>
          </header>
          <p className="text-sm font-quicksand text-[#6c6965]">{e.degree}</p>
        </article>
      ))}
    </div>
  </section>
);
