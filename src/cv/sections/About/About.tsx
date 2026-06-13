"use client";

import { RESUME } from "@/cv/data";

export const About = () => (
  <section id="about" className="flex flex-col gap-3">
    <h2 className="text-xl font-semibold tracking-tight">About</h2>
    {RESUME.about.map((paragraph) => (
      <p key={paragraph} className="text-sm text-neutral-700 leading-relaxed">
        {paragraph}
      </p>
    ))}
  </section>
);
