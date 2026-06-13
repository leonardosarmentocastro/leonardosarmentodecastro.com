"use client";

import { notifications } from "@mantine/notifications";
import {
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { trackContactClick } from "@/analytics/events";
import { RESUME } from "@/cv/data";

const useCurrentBrazilTime = (): string => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString("en-US", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return currentTime;
};

const MAILTO = `mailto:${RESUME.hero.links.email}?subject=Project%20Opportunity%20Inquiry&body=Hello%20Leonardo%2C%0A%0AI%27m%20interested%20in%20discussing%20a%20potential%20project%20opportunity%20with%20you.%0A%0ABest%20regards`;

export const Contact = () => {
  const currentTime = useCurrentBrazilTime();
  const { whatsappMessage, whatsappDisplay, email, linkedin } =
    RESUME.hero.links;

  const handleWhatsapp = () => {
    trackContactClick({ channel: "whatsapp", location: "cv_contact_section" });
  };

  const handleEmail = () => {
    trackContactClick({ channel: "email", location: "cv_contact_section" });
    navigator.clipboard.writeText(email);
    notifications.show({
      color: "red",
      title: "Email copied",
      message: `The email "${email}" has been copied to clipboard!`,
    });
  };

  const handleLinkedin = () => {
    trackContactClick({ channel: "linkedin", location: "cv_contact_section" });
  };

  return (
    <section id="contact" className="flex flex-col gap-5 items-center">
      <h2 className="text-xl font-semibold tracking-tight">Get in Touch</h2>

      <div className="flex flex-col gap-3 items-stretch w-full max-w-md">
        <a
          className="flex flex-col items-center bg-[#128c7e] rounded-[20px] px-[30px] py-[15px] cursor-pointer hover:scale-[1.02] transition-transform"
          href={whatsappMessage}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsapp}
        >
          <IconBrandWhatsapp className="w-[28px] h-[28px] text-white mb-[6px]" />
          <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[18px]">
            MESSAGE ME on WHATSAPP
          </span>
          <span className="text-white font-jakarta-sans font-bold text-[12px] md:text-[14px]">
            {whatsappDisplay}
          </span>
        </a>

        <a
          className="flex flex-col items-center bg-[#BB001B] rounded-[20px] px-[30px] py-[15px] cursor-pointer hover:scale-[1.02] transition-transform"
          href={MAILTO}
          onClick={handleEmail}
        >
          <IconMail className="w-[28px] h-[28px] text-white mb-[6px]" />
          <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[18px]">
            SEND ME an EMAIL
          </span>
          <span className="text-white font-jakarta-sans font-bold text-[12px] md:text-[14px]">
            {email}
          </span>
        </a>

        <a
          className="flex flex-col items-center bg-[#0072B1] rounded-[20px] px-[30px] py-[15px] cursor-pointer hover:scale-[1.02] transition-transform"
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkedin}
        >
          <IconBrandLinkedin className="w-[28px] h-[28px] text-white mb-[6px]" />
          <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[18px]">
            MESSAGE ME on LINKEDIN
          </span>
        </a>
      </div>

      <p className="text-center text-[14px] font-spectral font-normal italic text-neutral-700">
        Current time for me is <strong>{currentTime}</strong> (GMT-3)
      </p>
    </section>
  );
};
