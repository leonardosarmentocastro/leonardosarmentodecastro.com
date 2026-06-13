"use client";

import { RESUME } from "@/cv/data";

export const Education = () => (
  <section id="education" className="flex flex-col gap-4">
    <h2 className="text-xl font-semibold tracking-tight">Education</h2>
    <div className="flex flex-col gap-4">
      {RESUME.education.map((e) => (
        <article key={e.school} className="flex flex-col gap-1">
          <header className="flex flex-row justify-between items-baseline gap-4">
            <h3 className="text-base font-semibold">{e.school}</h3>
            <span className="text-xs text-neutral-500 whitespace-nowrap">
              {e.period}
            </span>
          </header>
          <p className="text-sm text-neutral-700">{e.degree}</p>
        </article>
      ))}
    </div>
  </section>
);
