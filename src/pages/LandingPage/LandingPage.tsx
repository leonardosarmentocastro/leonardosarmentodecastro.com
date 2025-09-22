import Image from "next/image";

export const LandingPage = () => {
  return (
    <main className="overflow-hidden bg-[#171717]">
      <div className="z-0 relative min-h-screen min-w-screen">
        <Image
          src="/leonardo.01.jpg"
          alt="Leonardo Sarmento de Castro"
          className="object-cover object-[center_20%]"
          fill
          priority
        />

        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30" />
      </div>

      <div className="absolute min-h-screen min-w-screen top-0 left-0 z-10">
        <div className="flex flex-row min-h-screen min-w-screen">
          <div className="min-h-screen w-[10px] bg-[#74746C]" />

          <div className="grid grid-rows-[1fr_auto_1fr] gap-[30px] min-h-screen w-full">
            <div />

            <div className="px-[10px]">
              <h3 className="text-[14px] text-white font-[spectral] font-normal italic">
                est. 2011
              </h3>
              <h2 className="text-[14px] text-white font-[spectral] font-normal">
                FRONT-END AND FULL-STACK
              </h2>
              <h2 className="text-[16px] text-white font-[spectral] font-bold">
                SENIOR SOFTWARE DEVELOPER
              </h2>
              <div className="w-full h-[1px] bg-white my-1" />
              <h1 className="text-[24px] text-white font-[domine] font-normal">
                Leonardo Sarmento de Castro
              </h1>
            </div>

            <div className="flex flex-row gap-[5px] h-full">
              <div className="h-full w-[5px] bg-[#E5E5E0]" />

              <div className="flex flex-col w-full gap-[10px]">
                <div className="flex flex-col w-full gap-[5px]">
                  <button
                    type="button"
                    className="flex flex-row h-[35px] font-jakarta-sans text-[16px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] bg-[#E5E5E0] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(229,229,224,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">RESUME</div>
                      <div className="w-full h-[5px] bg-[rgba(229,229,224,0.5)]" />
                    </div>
                  </button>

                  <p className="text-[14px] text-white font-[spectral] font-normal italic">
                    I am a strongly committed and self-taught professional who
                    has been engaged in software development for 14 years,
                    working in various business niches worldwide.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-[5px]">
                  <button
                    type="button"
                    className="flex flex-row h-[35px] font-jakarta-sans text-[16px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] bg-[#0072B1] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(0,114,177,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">
                        LINKEDIN
                      </div>
                      <div className="w-full h-[5px] bg-[rgba(0,114,177,0.5)]" />
                    </div>
                  </button>

                  {/* <p className="text-[14px] text-white font-[spectral] font-normal italic">
                    My profound knowledge across the technical realm, coupled with natural creativity and a thirst for results, establishes a fast-paced, delivery-oriented professional profile.
                  </p> */}
                </div>

                <div className="flex flex-col w-full gap-[5px]">
                  <button
                    type="button"
                    className="flex flex-row h-[35px] font-jakarta-sans text-[16px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] bg-[#128C7E] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(18,140,126,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">
                        CONTACT ME
                      </div>
                      <div className="w-full h-[5px] bg-[rgba(18,140,126,0.5)]" />
                    </div>
                  </button>

                  {/* <p className="text-[14px] text-white font-[spectral] font-normal italic">
                    If you’re interested, I’d be glad to schedule a call.
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
