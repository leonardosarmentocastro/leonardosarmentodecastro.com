"use client";

import { Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconFileTypePdf,
  IconHome,
  IconMail,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { trackContactClick, trackResumePdfClick } from "@/analytics/events";
import { RESUME } from "@/cv/data";

const ITEM_CLASS =
  "flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-md text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors";

const DockTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Tooltip label={label} position="top" withArrow>
    {children}
  </Tooltip>
);

const Separator = () => (
  <span aria-hidden="true" className="w-px h-6 bg-neutral-200 mx-1" />
);

export const Dock = () => {
  const { linkedin, whatsapp, email, resumePdf } = RESUME.hero.links;

  const handleEmail = () => {
    trackContactClick({ channel: "email", location: "cv_dock" });
    navigator.clipboard.writeText(email);
    notifications.show({
      color: "red",
      title: "Email copied",
      message: `The email "${email}" has been copied to clipboard!`,
    });
  };

  const handleLinkedin = () => {
    trackContactClick({ channel: "linkedin", location: "cv_dock" });
  };

  const handleWhatsapp = () => {
    trackContactClick({ channel: "whatsapp", location: "cv_dock" });
  };

  return (
    <nav
      aria-label="CV quick actions"
      className="fixed bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur border border-neutral-200 shadow-lg rounded-full"
    >
      <DockTooltip label="Home">
        <Link href="/" aria-label="Home" className={ITEM_CLASS}>
          <IconHome className="w-5 h-5" />
        </Link>
      </DockTooltip>

      <Separator />

      <DockTooltip label="LinkedIn">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className={ITEM_CLASS}
          onClick={handleLinkedin}
        >
          <IconBrandLinkedin className="w-5 h-5" />
        </a>
      </DockTooltip>

      <DockTooltip label="Email">
        <button
          type="button"
          aria-label="Email"
          className={ITEM_CLASS}
          onClick={handleEmail}
        >
          <IconMail className="w-5 h-5" />
        </button>
      </DockTooltip>

      <DockTooltip label="WhatsApp">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={ITEM_CLASS}
          onClick={handleWhatsapp}
        >
          <IconBrandWhatsapp className="w-5 h-5" />
        </a>
      </DockTooltip>

      <Separator />

      <DockTooltip label="Open resume PDF">
        <a
          href={resumePdf}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open resume PDF"
          className={ITEM_CLASS}
          onClick={() => trackResumePdfClick()}
        >
          <IconFileTypePdf className="w-5 h-5" />
        </a>
      </DockTooltip>
    </nav>
  );
};
