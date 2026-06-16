"use client";

import {
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
  IconWorld,
} from "@tabler/icons-react";

import { RESUME } from "@/cv/data";

const BLURB_LEAD = "Senior Software Engineer with 10+ years of experience";

const ICON_LINK =
  "inline-flex items-center justify-center rounded-md border border-neutral-300 p-1.5 text-neutral-500 transition-colors";

export const Hero = () => {
  const { name, role, kicker, location, blurb, avatar, links } = RESUME.hero;
  const blurbBody = blurb.startsWith(BLURB_LEAD)
    ? blurb.slice(BLURB_LEAD.length).trimStart()
    : blurb;

  return (
    <section
      id="hero"
      className="flex flex-col items-center gap-4 md:flex-row md:items-stretch md:gap-8"
    >
      {/* biome-ignore lint/performance/noImgElement: static public portrait; next/image overhead unjustified */}
      <img
        src={avatar}
        alt={`${name} avatar`}
        data-testid="hero-avatar"
        className="h-[230px] w-[184px] shrink-0 self-center object-cover object-top md:aspect-auto md:h-full md:w-44 md:max-w-none md:self-stretch lg:w-52"
      />

      <div className="flex w-full flex-1 flex-col items-center gap-2 text-center md:items-start md:text-left">
        <p className="text-xs md:text-sm font-spectral font-bold uppercase text-[#3c78d8]">
          {kicker}
        </p>
        <p className="text-base font-spectral font-bold uppercase text-[#3c78d8]">
          {role}
        </p>
        <h1 className="text-[20px] md:text-4xl font-domine text-[#2d2a24] tracking-tight">
          {name}
        </h1>
        <p className="text-sm font-quicksand text-[#6c6965]">{location}</p>
        <p className="text-sm font-quicksand text-[#6d6964] mt-2">
          <span className="font-bold">{BLURB_LEAD}</span> {blurbBody}
        </p>

        <div className="mt-3 flex flex-row justify-center gap-3 md:justify-start">
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className={`${ICON_LINK} hover:border-[#0072b1] hover:text-[#0072b1]`}
          >
            <IconBrandLinkedin className="w-5 h-5" />
          </a>
          <a
            href={`mailto:${links.email}`}
            aria-label="Email"
            className={`${ICON_LINK} hover:border-[#bb001b] hover:text-[#bb001b]`}
          >
            <IconMail className="w-5 h-5" />
          </a>
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className={`${ICON_LINK} hover:border-[#128c7e] hover:text-[#128c7e]`}
          >
            <IconBrandWhatsapp className="w-5 h-5" />
          </a>
          <a
            href={links.site}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Personal site"
            className={`${ICON_LINK} hover:border-black hover:text-black`}
          >
            <IconWorld className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};
