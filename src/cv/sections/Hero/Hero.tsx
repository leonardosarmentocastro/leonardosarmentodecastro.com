"use client";

import {
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
  IconWorld,
} from "@tabler/icons-react";

import { RESUME } from "@/cv/data";

export const Hero = () => {
  const { name, role, kicker, location, blurb, avatar, links } = RESUME.hero;

  return (
    <section id="hero" className="flex flex-row gap-6 items-start">
      <div className="flex-1 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-domine text-[#2d2a24] tracking-tight">
          {name}
        </h1>
        <p className="text-base font-spectral font-bold uppercase text-[#3c78d8]">
          {role}
        </p>
        <p className="text-sm font-spectral uppercase text-[#3c78d8]">
          {kicker}
        </p>
        <p className="text-sm text-[#6c6965]">{location}</p>
        <p className="text-sm font-quicksand font-bold text-[#6d6964] mt-2">
          {blurb}
        </p>

        <div className="flex flex-row gap-3 mt-3 text-neutral-500">
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-neutral-900 transition-colors"
          >
            <IconBrandLinkedin className="w-5 h-5" />
          </a>
          <a
            href={`mailto:${links.email}`}
            aria-label="Email"
            className="hover:text-neutral-900 transition-colors"
          >
            <IconMail className="w-5 h-5" />
          </a>
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="hover:text-neutral-900 transition-colors"
          >
            <IconBrandWhatsapp className="w-5 h-5" />
          </a>
          <a
            href={links.site}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Personal site"
            className="hover:text-neutral-900 transition-colors"
          >
            <IconWorld className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* biome-ignore lint/performance/noImgElement: avatar is a small static asset; next/image overhead unjustified */}
      <img
        src={avatar}
        alt={`${name} avatar`}
        className="w-24 h-24 rounded-full object-cover flex-shrink-0"
      />
    </section>
  );
};
