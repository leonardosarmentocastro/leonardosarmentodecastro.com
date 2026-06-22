"use client";

import { Modal } from "@mantine/core";
import { IconFileText, IconFileTypePdf, IconWorld } from "@tabler/icons-react";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  trackResumeAtsClick,
  trackResumePdfClick,
  trackResumeWebClick,
} from "@/analytics/events";
import { RESUME } from "@/cv/data";

export type ResumeOptionKey = "recruiterPdf" | "ats" | "web";

type Descriptor = {
  href: string;
  internal: boolean;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  bg: string;
  track: () => void;
};

const DESCRIPTORS: Record<ResumeOptionKey, Descriptor> = {
  recruiterPdf: {
    href: RESUME.hero.links.resumePdf,
    internal: false,
    Icon: IconFileTypePdf,
    title: "RECRUITER PDF",
    subtitle: "Best for download, print, or sharing offline",
    bg: "#BB001B",
    track: trackResumePdfClick,
  },
  ats: {
    href: "/cv/ats",
    internal: false,
    Icon: IconFileText,
    title: "ATS / MACHINE-READABLE PDF",
    subtitle: "Plain text, optimized for applicant tracking systems",
    bg: "#404040",
    track: trackResumeAtsClick,
  },
  web: {
    href: "/cv",
    internal: true,
    Icon: IconWorld,
    title: "VIEW WEB VERSION",
    subtitle: "Interactive, always up to date",
    bg: "#171717",
    track: trackResumeWebClick,
  },
};

type Props = {
  opened: boolean;
  onClose: () => void;
  options: ResumeOptionKey[];
  onChoiceClick?: () => void;
};

export const ResumeOptionsModal = ({
  opened,
  onClose,
  options,
  onChoiceClick,
}: Props) => {
  const cardClass =
    "flex flex-col items-center rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform";

  return (
    <Modal opened={opened} onClose={onClose} centered size="auto">
      <div className="flex flex-col gap-[20px] items-center">
        <h1 className="text-center font-jakarta-sans text-[24px] md:text-[32px] font-black">
          VIEW MY RESUME
        </h1>

        <div className="flex flex-col gap-[10px] items-center w-full">
          {options.map((key) => {
            const d = DESCRIPTORS[key];
            const onClick = () => {
              onChoiceClick?.();
              d.track();
            };
            const inner = (
              <>
                <d.Icon className="w-[32px] h-[32px] text-white mb-[10px]" />
                <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
                  {d.title}
                </span>
                <span className="text-white font-jakarta-sans font-normal text-[12px] md:text-[16px]">
                  {d.subtitle}
                </span>
              </>
            );
            return d.internal ? (
              <Link
                key={key}
                className={cardClass}
                style={{ backgroundColor: d.bg }}
                href={d.href}
                onClick={onClick}
              >
                {inner}
              </Link>
            ) : (
              <a
                key={key}
                className={cardClass}
                style={{ backgroundColor: d.bg }}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
