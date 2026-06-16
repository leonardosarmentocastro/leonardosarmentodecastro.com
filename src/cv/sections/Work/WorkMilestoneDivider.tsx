"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { splitMilestoneText } from "./milestone-text";

gsap.registerPlugin(ScrollTrigger);

type Props = { text: string };

export const WorkMilestoneDivider = ({ text }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const { emoji, body } = splitMilestoneText(text);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!rootRef.current || !bodyRef.current) return;

      gsap.set(bodyRef.current, { opacity: 0, y: 8 });
      if (emoji && emojiRef.current) {
        gsap.set(emojiRef.current, { scale: 0, rotation: -20, opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 70%",
          once: true,
        },
      });

      if (emoji && emojiRef.current) {
        tl.to(emojiRef.current, {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.7,
          ease: "back.out(1.7)",
        }).to(
          bodyRef.current,
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.35",
        );
      } else {
        tl.to(bodyRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });
    return () => mm.revert();
  }, [emoji, body]);

  return (
    <div
      ref={rootRef}
      className="relative z-10 w-full py-10 md:py-12 bg-white"
      data-testid="work-milestone"
      role="note"
      aria-label={text}
    >
      <p className="text-center text-sm italic font-spectral text-[#6c6965] px-6">
        {emoji ? (
          <span
            ref={emojiRef}
            data-testid="milestone-emoji"
            className="inline-block mr-1"
          >
            {emoji}
          </span>
        ) : null}
        <span ref={bodyRef} data-testid="milestone-body">
          {body}
        </span>
      </p>
    </div>
  );
};
