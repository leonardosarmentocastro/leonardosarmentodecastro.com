import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
  IconWorld,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

import { RESUME } from "@/cv/data";

type Channel = {
  label: string;
  value: string;
  Icon: ComponentType<{ className?: string }>;
  chip: string;
  full?: boolean;
};

const { github, whatsappDisplay, email, site } = RESUME.hero.links;

const CHANNELS: Channel[] = [
  {
    label: "LinkedIn",
    value: "linkedin.com/in/leonardo-sarmento-de-castro",
    Icon: IconBrandLinkedin,
    chip: "#0072b1",
  },
  {
    label: "GitHub",
    value: github.replace(/^https?:\/\//, ""),
    Icon: IconBrandGithub,
    chip: "#24292f",
  },
  {
    label: "WhatsApp",
    value: whatsappDisplay,
    Icon: IconBrandWhatsapp,
    chip: "#128c7e",
  },
  { label: "Email", value: email, Icon: IconMail, chip: "#bb001b" },
  {
    label: "Personal Site",
    value: site.replace(/^https?:\/\//, ""),
    Icon: IconWorld,
    chip: "#2d2a24",
    full: true,
  },
];

const Card = ({ c }: { c: Channel }) => (
  <div
    className={`border border-neutral-200 rounded-lg p-4 flex flex-col gap-1 ${c.full ? "sm:col-span-2" : ""}`}
  >
    <span className="flex flex-row items-center gap-2">
      <span
        className="flex h-[22px] w-[22px] items-center justify-center rounded-md"
        style={{ backgroundColor: c.chip }}
      >
        <c.Icon className="w-3.5 h-3.5 text-white" />
      </span>
      <span className="text-sm font-semibold text-[#2d2a24]">{c.label}</span>
    </span>
    <span className="block text-xs text-neutral-500 break-all">{c.value}</span>
  </div>
);

export const ContactPrint = () => (
  <section id="contact" className="flex flex-col gap-4 font-quicksand">
    <h2 className="text-xl font-domine text-[#2d2a24] tracking-tight">
      Contact
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CHANNELS.map((c) => (
        <Card key={c.label} c={c} />
      ))}
    </div>
  </section>
);
