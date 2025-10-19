import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useState } from "react";

import { LANDING_PAGE_COVER_IMAGES } from "@/components/pages/LandingPage/CoverImagesLoop/constants";

// TODO: add a `app/loading.tsx` file to previously load images for smoother first load
// references:
// https://nextjs.org/docs/app/getting-started/linking-and-navigating#prefetching
// https://nextjs.org/docs/app/getting-started/linking-and-navigating#slow-networks
export const CoverImagesLoop = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // image cover fade in/out infinite loop
  useGSAP(() => {
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        // Change image when animation repeats
        setCurrentImageIndex(
          (prev) => (prev + 1) % LANDING_PAGE_COVER_IMAGES.length,
        );
      },
    });

    // Fade in: 3 seconds (opacity 0 → 1)
    tl.fromTo(
      "#landing-page-cover-image-element",
      { opacity: 0 },
      { opacity: 1, duration: 3 },
    )
      // Hold: 3 seconds (opacity stays at 1)
      .to("#landing-page-cover-image-element", { opacity: 1, duration: 3 })
      // Fade out: 1 second (opacity 1 → 0)
      .to("#landing-page-cover-image-element", { opacity: 0, duration: 3 });

    return () => {
      tl.kill();
    };
  }, [LANDING_PAGE_COVER_IMAGES.length, setCurrentImageIndex]);

  return (
    <div className="z-0 relative h-screen w-screen lg:w-auto">
      <Image
        alt="Leonardo Sarmento de Castro"
        className="object-cover object-[center_20%] opacity-0"
        id="landing-page-cover-image-element"
        // TODO: optimize for first load
        src={LANDING_PAGE_COVER_IMAGES[currentImageIndex]}
        priority
        fill
      />

      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30" />
    </div>
  );
};
