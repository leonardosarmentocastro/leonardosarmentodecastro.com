"use client";

import Image from "next/image";
import { useState } from "react";

import { COMPANY_LOGOS } from "./company-logos";

const getInitials = (company: string): string =>
  company
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

type Props = { company: string };

export const CompanyLogo = ({ company }: Props) => {
  const [hasError, setHasError] = useState(false);
  const src = COMPANY_LOGOS[company];

  if (!src || hasError) {
    return (
      <div
        aria-hidden="true"
        className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-[11px] font-semibold select-none"
      >
        {getInitials(company)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      width={36}
      height={36}
      alt={company}
      className="rounded-full"
      onError={() => setHasError(true)}
    />
  );
};
