import { companyLogoSrc } from "@/cv/company-logos";

type Props = { company: string; className?: string };

export const CompanyLogo = ({ company, className = "" }: Props) => {
  const src = companyLogoSrc(company);
  if (!src) return null;

  return (
    // biome-ignore lint/performance/noImgElement: static public logo; next/image overhead unjustified
    <img
      src={src}
      alt=""
      role="presentation"
      className={`w-12 h-12 md:w-[60px] md:h-[60px] object-contain shrink-0 ${className}`}
    />
  );
};
