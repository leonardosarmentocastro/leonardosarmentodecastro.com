"use client";

import { useGSAP } from "@gsap/react";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  trackContactClick,
  trackContactModalDismiss,
  trackContactModalOpen,
  trackResumeClick,
  trackResumeModalDismiss,
} from "@/analytics/events";
import { CoverImagesLoop } from "@/components/pages/LandingPage/CoverImagesLoop/CoverImagesLoop";
import { RESUME } from "@/cv/data";
import { ResumeOptionsModal } from "@/cv/ResumeOptionsModal";

const ACCORDIONS = [
  {
    id: 1,
    text: "#landing-page-accordion-1-text",
    progressBar: "#landing-page-accordion-1-button-progress-bar",
  },
  {
    id: 2,
    text: "#landing-page-accordion-2-text",
    progressBar: "#landing-page-accordion-2-button-progress-bar",
  },
  {
    id: 3,
    text: "#landing-page-accordion-3-text",
    progressBar: "#landing-page-accordion-3-button-progress-bar",
  },
];

// TODO: optimize images for first load (the image fails to change gradually on first load, as it is not cached yet)
// TODO: improve accessibility (ARIA roles, keyboard navigation, etc.)
// TODO: refactor GSAP code to be cleaner and more modular (encapsulate components and their animations, take advantage of SSR where possible, etc.)
// TODO: improve SEO (meta tags, structured data, etc.)
// TODO: change favicon
// TODO: add tests (e.g., unit tests, integration tests, e2e tests, etc.)
// TODO: add more content (e.g., portfolio, testimonials, blog, etc.)
export const LandingPage = () => {
  const links = RESUME.hero.links;
  const [opened, { open, close }] = useDisclosure(false);
  const [
    resumeModalOpened,
    { open: openResumeModal, close: closeResumeModal },
  ] = useDisclosure(false);
  const [currentTime, setCurrentTime] = useState("");
  const ctaClickedRef = useRef(false);
  const resumeChoiceClickedRef = useRef(false);

  const handleModalClose = () => {
    if (!ctaClickedRef.current) trackContactModalDismiss();
    ctaClickedRef.current = false;
    close();
  };

  const handleWhatsappClick = () => {
    ctaClickedRef.current = true;
    trackContactClick({ channel: "whatsapp", location: "landing_modal" });
  };

  const handleEmailClick = () => {
    ctaClickedRef.current = true;
    trackContactClick({ channel: "email", location: "landing_modal" });
    navigator.clipboard.writeText(links.email);
    notifications.show({
      color: "red",
      title: "Email copied",
      message: `The email "${links.email}" has been copied to clipboard!`,
    });
  };

  const handleResumeModalClose = () => {
    if (!resumeChoiceClickedRef.current) trackResumeModalDismiss();
    resumeChoiceClickedRef.current = false;
    closeResumeModal();
  };

  const handleResumeChoiceClick = () => {
    resumeChoiceClickedRef.current = true;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo", // GMT-3 (Brazil time)
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeString);
    };

    // Update immediately
    updateTime();

    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // animations
  /////
  // Initialize all accordion texts as hidden (to later be animated in sequence)
  useGSAP(() => {
    gsap.set(
      [
        "#landing-page-accordion-1-text",
        "#landing-page-accordion-2-text",
        "#landing-page-accordion-3-text",
      ],
      { opacity: 0, height: 0 },
    );

    gsap.set(
      [
        "#landing-page-accordion-1-button-progress-bar",
        "#landing-page-accordion-2-button-progress-bar",
        "#landing-page-accordion-3-button-progress-bar",
      ],
      { width: "0%" },
    );
  });

  // page elements fade/slide in
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const tl = gsap.timeline();

    // vertical bars slide in
    /////
    mm.add("(min-width: 1024px)", () => {
      tl.fromTo(
        "#landing-page-content-container",
        { opacity: 0, translateY: "100%" },
        { opacity: 1, translateY: "0%", duration: 1, ease: "circ.out" },
      );
    }).add("(max-width: 1023px)", () => {
      tl.fromTo(
        "#landing-page-vertical-bar-1",
        { translateX: "-100%" },
        { translateX: "0%", duration: 1, ease: "circ.out" },
      );
    });

    tl.fromTo(
      ["#landing-page-vertical-bar-1"],
      { translateY: "-100%" },
      { translateY: "0%", duration: 1, ease: "circ.out" },
    );

    // headings slide in
    /////
    tl.fromTo(
      [
        "#landing-page-headings-establishment",
        "#landing-page-headings-skills",
        "#landing-page-headings-position",
      ],
      { opacity: 0, translateX: "-10%" },
      {
        opacity: 1,
        translateX: "0%",
        duration: 0.5,
        ease: "slow",
        stagger: 0.5,
      },
    );

    tl.fromTo(
      "#landing-page-headings-separator",
      { width: "0%" },
      { width: "100%", duration: 1, ease: "power2.out" },
    );

    tl.fromTo(
      "#landing-page-headings-name",
      { opacity: 0, translateX: "-5%" },
      { opacity: 1, translateX: "0%", duration: 2, ease: "power2.out" },
    );

    // landing-page-accordions-container
    /////
    tl.fromTo(
      "#landing-page-vertical-bar-2",
      { translateY: "100%" },
      { translateY: "0%", duration: 0.3, ease: "circ.out" },
    );

    tl.fromTo(
      [
        "#landing-page-accordion-1",
        "#landing-page-accordion-2",
        "#landing-page-accordion-3",
      ],
      { opacity: 0, translateX: "10%" },
      {
        opacity: 1,
        translateX: "0%",
        duration: 0.3,
        ease: "power1.in",
        stagger: 0.3,
        onComplete: () => {
          // Start accordion cycling after initial animations complete
          startAccordionCycle();
        },
      },
    );

    return () => {
      tl.kill();
    };
  });

  // accordion cycling animations
  const startAccordionCycle = () => {
    let currentAccordionIndex = 0;

    const cycleAccordion = () => {
      const current = ACCORDIONS[currentAccordionIndex];
      const tl = gsap.timeline();

      // Show text
      tl.fromTo(
        current.text,
        { opacity: 0, height: 0 },
        { opacity: 1, height: "auto", duration: 1, ease: "circ.out" },
      );

      // Animate progress bar from 0% to 100% over 7 seconds
      tl.fromTo(
        current.progressBar,
        { width: "0%" },
        { width: "100%", duration: 7, ease: "none" },
      );

      // Hide text and reset progress bar
      tl.to([current.text, current.progressBar], {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          // Reset progress bar width and text opacity for next cycle
          gsap.set(current.progressBar, { width: "0%", opacity: 1 });
          gsap.set(current.text, { opacity: 0, height: 0 });

          // Move to next accordion
          currentAccordionIndex =
            (currentAccordionIndex + 1) % ACCORDIONS.length;

          // Continue cycling
          cycleAccordion();
        },
      });
    };

    // Start the cycle
    cycleAccordion();
  };

  return (
    <>
      <Modal opened={opened} onClose={handleModalClose} centered size="auto">
        <div className="flex flex-col gap-[20px] items-center">
          <h1 className="text-center font-jakarta-sans text-[24px] md:text-[32px] font-black">
            CONTACT ME
          </h1>

          <div className="flex flex-col gap-[10px] items-center w-full">
            <a
              className="flex flex-col items-center bg-[#128c7e] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
              href={links.whatsappMessage}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappClick}
            >
              <IconBrandWhatsapp className="w-[32px] h-[32px] text-white mb-[10px]" />

              <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
                MESSAGE ME on WHATSAPP
              </span>
              <span className="text-white font-jakarta-sans font-bold text-[12px] md:text-[18px]">
                {links.whatsappDisplay}
              </span>
            </a>

            <a
              className="flex flex-col items-center bg-[#BB001B] rounded-[20px] px-[30px] py-[15px] w-full max-w-full cursor-pointer hover:scale-[1.02] transition-transform"
              href="mailto:negocios.leonardosarmentocastro@gmail.com?subject=Project%20Opportunity%20Inquiry&body=Hello%20Leonardo%2C%0A%0AI%27m%20interested%20in%20discussing%20a%20potential%20project%20opportunity%20with%20you.%0A%0ABest%20regards"
              onClick={handleEmailClick}
            >
              <IconMail className="w-[32px] h-[32px] text-white mb-[10px]" />

              <span className="text-white font-jakarta-sans font-bold text-[14px] md:text-[20px]">
                SEND ME an EMAIL
              </span>
              <span className="text-white font-jakarta-sans font-bold text-[12px] md:text-[18px]">
                {links.email}
              </span>
            </a>

            <p className="text-center text-[14px] font-spectral font-normal italic">
              Current time for me is <strong>{currentTime}</strong> (GMT-3)
            </p>
          </div>
        </div>
      </Modal>

      <ResumeOptionsModal
        opened={resumeModalOpened}
        onClose={handleResumeModalClose}
        options={["recruiterPdf", "ats", "web"]}
        onChoiceClick={handleResumeChoiceClick}
      />

      <main className="block lg:grid grid-cols-[35%_65%] relative lg:static overflow-hidden bg-[#171717]">
        <CoverImagesLoop />

        <div
          className="absolute lg:static h-screen w-screen lg:w-auto top-0 left-0 z-10"
          id="landing-page-content-container"
        >
          <div className="flex flex-row min-h-screen min-w-screen bg-none lg:bg-white">
            <div
              className="min-h-screen w-[10px] md:w-[20px] bg-[#74746C] block lg:hidden"
              id="landing-page-vertical-bar-1"
            />

            <div className="grid grid-rows-[1fr_auto_1fr] md:grid-rows-[.8fr_auto_1.2fr] lg:grid-rows-[.5fr_auto_1.5fr] gap-[30px] min-h-screen w-full lg:bg-none lg:bg-[rgba(0,0,0,.7)]">
              <div />

              <div className="px-[10px] md:px-[20px] md:max-w-[95%] max-w-full lg:max-w-[800px]">
                <h3
                  className="text-[14px] md:text-[20px] text-white font-spectral font-normal italic"
                  id="landing-page-headings-establishment"
                >
                  est. 2011
                </h3>
                <h2
                  className="text-[14px] md:text-[20px] text-white font-spectral font-normal"
                  id="landing-page-headings-skills"
                >
                  TYPESCRIPT | NODE.JS | REACT | AWS
                </h2>
                <h2
                  className="text-[16px] md:text-[28px] text-white font-spectral font-bold"
                  id="landing-page-headings-position"
                >
                  SENIOR SOFTWARE ENGINEER
                </h2>
                <div
                  className="w-full h-px bg-white my-1"
                  id="landing-page-headings-separator"
                />
                <h1
                  className="text-[24px] md:text-[48px] text-white font-[domine] font-normal"
                  id="landing-page-headings-name"
                >
                  Leonardo Sarmento de Castro
                </h1>
              </div>

              <div className="flex flex-row gap-[5px] md:gap-[10px] h-full max-w-full lg:max-w-[800px]">
                <div
                  className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0]"
                  id="landing-page-vertical-bar-2"
                />

                <div
                  className="flex flex-col w-full gap-[10px]"
                  id="landing-page-accordions-container"
                >
                  <div
                    className="flex flex-col w-full gap-[5px]"
                    id="landing-page-accordion-1"
                  >
                    <button
                      type="button"
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                      onClick={() => {
                        trackResumeClick();
                        openResumeModal();
                      }}
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(229,229,224,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          RESUME
                        </p>
                        <div
                          className="w-full h-[5px] md:h-[10px] bg-[rgba(229,229,224,0.5)]"
                          id="landing-page-accordion-1-button-progress-bar"
                        />
                      </div>
                    </button>

                    <p
                      className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic overflow-hidden"
                      id="landing-page-accordion-1-text"
                    >
                      I am a strongly committed and self-taught professional who
                      has been engaged in software development for more than a
                      decade, working in various business niches worldwide.
                    </p>
                  </div>

                  <div
                    className="flex flex-col w-full gap-[5px]"
                    id="landing-page-accordion-2"
                  >
                    <a
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                      href={links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackContactClick({
                          channel: "linkedin",
                          location: "landing_modal",
                        })
                      }
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#0072B1] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(0,114,177,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          LINKEDIN
                        </p>
                        <div
                          className="w-full h-[5px] md:h-[10px] bg-[rgba(0,114,177,0.5)] lg:bg-[#72ABC8]"
                          id="landing-page-accordion-2-button-progress-bar"
                        />
                      </div>
                    </a>

                    <p
                      className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic overflow-hidden"
                      id="landing-page-accordion-2-text"
                    >
                      My profound knowledge across the technical realm, coupled
                      with natural creativity and a thirst for results,
                      establishes a fast-paced, delivery-oriented professional
                      profile.
                    </p>
                  </div>

                  <div
                    className="flex flex-col w-full gap-[5px]"
                    id="landing-page-accordion-3"
                  >
                    <button
                      type="button"
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                      onClick={() => {
                        trackContactModalOpen();
                        open();
                      }}
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#128C7E] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(18,140,126,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          CONTACT ME
                        </p>
                        <div
                          className="w-full h-[5px] md:h-[10px] bg-[rgba(18,140,126,0.5)] lg:bg-[#46A296]"
                          id="landing-page-accordion-3-button-progress-bar"
                        />
                      </div>
                    </button>

                    <p
                      className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic overflow-hidden"
                      id="landing-page-accordion-3-text"
                    >
                      If you're interested, I'd be glad to schedule a call.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
