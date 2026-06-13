"use client";

import { Modal } from "@mantine/core";
import { IconFileTypePdf, IconWorld } from "@tabler/icons-react";
import Link from "next/link";

import { trackResumePdfClick, trackResumeWebClick } from "@/analytics/events";
import { RESUME } from "@/cv/data";

type Props = {
  opened: boolean;
  onClose: () => void;
  onChoiceClick?: () => void;
};

export const ResumeOptionsModal = ({
  opened,
  onClose,
  onChoiceClick,
}: Props) => {
  const handlePdfClick = () => {
    onChoiceClick?.();
    trackResumePdfClick();
  };

  const handleWebClick = () => {
    onChoiceClick?.();
    trackResumeWebClick();
  };

  return (
    <Modal opened={opened} onClose={onClose} centered size="auto">
      <div className="flex flex-col gap-[20px] items-center">
        <h1 className="text-center font-jakarta-sans text-[24px] md:text-[32px] font-black">
          VIEW MY RESUME
        </h1>

        <div className="flex flex-col gap-[10px] items-center w-full">
          <a
            className="flex flex-col items-center bg-[#BB001B] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
            href={RESUME.hero.links.resumePdf}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePdfClick}
          >
            <IconFileTypePdf className="w-[32px] h-[32px] text-white mb-[10px]" />
            <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
              OPEN PDF (Google Drive)
            </span>
            <span className="text-white font-jakarta-sans font-normal text-[12px] md:text-[16px]">
              Best for download, print, or sharing offline
            </span>
          </a>

          <Link
            className="flex flex-col items-center bg-[#171717] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
            href="/cv"
            onClick={handleWebClick}
          >
            <IconWorld className="w-[32px] h-[32px] text-white mb-[10px]" />
            <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
              VIEW WEB VERSION
            </span>
            <span className="text-white font-jakarta-sans font-normal text-[12px] md:text-[16px]">
              Interactive, always up to date
            </span>
          </Link>
        </div>
      </div>
    </Modal>
  );
};
