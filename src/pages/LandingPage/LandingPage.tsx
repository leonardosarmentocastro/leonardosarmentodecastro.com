import Image from "next/image";

const YEARS_OF_EXPERIENCE = new Date().getFullYear() - 2011;

export const LandingPage = () => {
  return (
    <main className="overflow-hidden bg-[#171717]">
      <div className="z-0 relative min-h-screen min-w-screen">
        {/* TODO: mudar de imagem a cada 5s (ao mesmo tempo que sanfona os botões) */}
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
          <div className="min-h-screen w-[10px] md:w-[20px] bg-[#74746C]" />

          <div className="grid grid-rows-[1fr_auto_1fr] gap-[30px] min-h-screen w-full">
            <div />

            <div className="px-[10px]">
              <h3 className="text-[14px] md:text-[24px] text-white font-[spectral] font-normal italic">
                est. 2011
              </h3>
              <h2 className="text-[14px] md:text-[24px] text-white font-[spectral] font-normal">
                FRONT-END AND FULL-STACK
              </h2>
              <h2 className="text-[16px] md:text-[32px] text-white font-[spectral] font-bold">
                SENIOR SOFTWARE DEVELOPER
              </h2>
              <div className="w-full h-[1px] bg-white my-1" />
              <h1 className="text-[24px] md:text-[48px] text-white font-[domine] font-normal">
                Leonardo Sarmento de Castro
              </h1>
            </div>

            <div className="flex flex-row gap-[5px] h-full">
              <div className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0]" />

              <div className="flex flex-col w-full gap-[10px]">
                <div className="flex flex-col w-full gap-[5px]">
                  {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                  <button
                    type="button"
                    className="flex flex-row h-[35px] md:h-[80px] font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(229,229,224,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">RESUME</div>
                      <div className="w-full h-[5px] md:h-[10px] bg-[rgba(229,229,224,0.5)]" />
                    </div>
                  </button>

                  {/* TODO: substituir 14 anos por valor computado referente ao meu tempo de experiência */}
                  <p className="text-[14px] md:text-[24px] text-white font-[spectral] font-normal italic">
                    I am a strongly committed and self-taught professional who
                    has been engaged in software development for{" "}
                    {YEARS_OF_EXPERIENCE} years, working in various business
                    niches worldwide.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-[5px]">
                  {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                  <button
                    type="button"
                    className="flex flex-row h-[35px] md:h-[80px] font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] md:w-[10px] bg-[#0072B1] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(0,114,177,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">
                        LINKEDIN
                      </div>
                      <div className="w-full h-[5px] md:h-[10px] bg-[rgba(0,114,177,0.5)]" />
                    </div>
                  </button>

                  {/* <p className="text-[14px] md:text-[24px] text-white font-[spectral] font-normal italic">
                    My profound knowledge across the technical realm, coupled with natural creativity and a thirst for results, establishes a fast-paced, delivery-oriented professional profile.
                  </p> */}
                </div>

                <div className="flex flex-col w-full gap-[5px]">
                  {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                  <button
                    type="button"
                    className="flex flex-row h-[35px] md:h-[80px] font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold"
                  >
                    <div className="h-full w-[5px] md:w-[10px] bg-[#128C7E] inline-block" />

                    <div className="flex flex-col justify-between w-full h-full bg-[rgba(18,140,126,0.5)] text-start">
                      <div className="grow pl-[5px] content-center">
                        CONTACT ME
                      </div>
                      <div className="w-full h-[5px] md:h-[10px] bg-[rgba(18,140,126,0.5)]" />
                    </div>
                  </button>

                  {/* <p className="text-[14px] md:text-[24px] text-white font-[spectral] font-normal italic">
                    If you&#x27;re interested, I&#x27;d be glad to schedule a call.
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
