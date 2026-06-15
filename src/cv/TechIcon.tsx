import { getTechIconSvg } from "@/cv/icons";

interface TechIconProps {
  alias: string;
  size: number;
}

export const TechIcon = ({ alias, size }: TechIconProps) => {
  const svg = getTechIconSvg(alias);
  if (!svg) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        lineHeight: 0,
        flexShrink: 0,
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG strings are extracted from the tech-stack-icons devDependency at build time, not from user input
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
