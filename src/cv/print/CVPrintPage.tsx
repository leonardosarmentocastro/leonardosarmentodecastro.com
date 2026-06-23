"use client";

import "@/cv/styles.css";
import "./styles.css";

import { About } from "@/cv/sections/About/About";
import { Education } from "@/cv/sections/Education/Education";
import { Hero } from "@/cv/sections/Hero/Hero";
import { Skills } from "@/cv/sections/Skills/Skills";
import { ContactPrint } from "./ContactPrint";
import { WorkPrintTimeline } from "./WorkPrintTimeline";

export const CVPrintPage = () => (
  <main className="cv-print bg-white text-neutral-900">
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Hero printMode />
      <hr className="my-12 border-neutral-200" />
      <About printMode />
      <hr className="my-12 border-neutral-200" />
      <ContactPrint />
      <hr className="my-12 border-neutral-200" />
      <WorkPrintTimeline />
      <hr className="my-12 border-neutral-200" />
      <Education />
      <hr className="my-12 border-neutral-200" />
      <Skills printMode />
    </div>
  </main>
);
