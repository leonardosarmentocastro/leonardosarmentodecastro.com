"use client";

import "@/cv/cv.css";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Dock } from "@/cv/Dock/Dock";
import { About } from "@/cv/sections/About/About";
import { Contact } from "@/cv/sections/Contact/Contact";
import { Education } from "@/cv/sections/Education/Education";
import { Hero } from "@/cv/sections/Hero/Hero";
import { Skills } from "@/cv/sections/Skills/Skills";
import { Work } from "@/cv/sections/Work/Work";

gsap.registerPlugin(ScrollTrigger);

const SECTION_IDS = ["hero", "about", "work", "education", "skills", "contact"];

export const CVPage = () => {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(
        SECTION_IDS.map((id) => `#${id}`),
        { opacity: 0, y: 12 },
      );
      for (const id of SECTION_IDS) {
        gsap.to(`#${id}`, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `#${id}`,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      gsap.fromTo(
        "#cv-dock",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.3 },
      );
    });

    return () => {
      mm.revert();
    };
  });

  return (
    <main className="bg-white text-neutral-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
        <Hero />
        <hr className="my-12 border-neutral-200" />
        <About />
        <hr className="my-12 border-neutral-200" />
        <Work />
        <hr className="my-12 border-neutral-200" />
        <Education />
        <hr className="my-12 border-neutral-200" />
        <Skills />
        <hr className="my-12 border-neutral-200" />
        <Contact />
      </div>
      <div id="cv-dock">
        <Dock />
      </div>
    </main>
  );
};
