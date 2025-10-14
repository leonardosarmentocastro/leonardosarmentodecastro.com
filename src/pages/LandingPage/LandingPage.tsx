"use client";

import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";

import image1 from "@/../public/leonardo.01.jpg";

export const LandingPage = () => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close}>
        {/* <Modal.Title>My Modal</Modal.Title>
        <Modal.Body>
          <p>This is the content of the modal.</p>
        </Modal.Body> */}
      </Modal>

      <main className="block lg:grid grid-cols-[35%_65%] relative lg:static overflow-hidden bg-[#171717]">
        <div className="z-0 relative h-screen w-screen lg:w-auto">
          {/* TODO: mudar de imagem a cada 5s (ao mesmo tempo que sanfona os botões) */}
          <Image
            src={image1}
            alt="Leonardo Sarmento de Castro"
            className="object-cover object-[center_20%]"
            priority
          />

          <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30" />
        </div>

        <div className="absolute lg:static h-screen w-screen lg:w-auto top-0 left-0 z-10">
          <div className="flex flex-row min-h-screen min-w-screen bg-none lg:bg-[#fff]">
            <div className="min-h-screen w-[10px] md:w-[20px] bg-[#74746C] block lg:hidden" />

            <div className="grid grid-rows-[1fr_auto_1fr] md:grid-rows-[.8fr_auto_1.2fr] lg:grid-rows-[.5fr_auto_1.5fr] gap-[30px] min-h-screen w-full lg:bg-none lg:bg-[rgba(0,0,0,.7)]">
              <div />

              <div className="px-[10px] md:px-[20px] md:max-w-[95%] max-w-full lg:max-w-[800px]">
                <h3 className="text-[14px] md:text-[20px] text-white font-spectral font-normal italic">
                  est. 2011
                </h3>
                <h2 className="text-[14px] md:text-[20px] text-white font-spectral font-normal">
                  FRONT-END AND FULL-STACK
                </h2>
                <h2 className="text-[16px] md:text-[28px] text-white font-spectral font-bold">
                  SENIOR SOFTWARE DEVELOPER
                </h2>
                <div className="w-full h-[1px] bg-white my-1" />
                <h1 className="text-[24px] md:text-[48px] text-white font-[domine] font-normal">
                  Leonardo Sarmento de Castro
                </h1>
              </div>

              <div className="flex flex-row gap-[5px] md:gap-[10px] h-full max-w-full lg:max-w-[800px]">
                <div className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0]" />

                <div className="flex flex-col w-full gap-[10px]">
                  <div className="flex flex-col w-full gap-[5px]">
                    {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                    <button
                      type="button"
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#E5E5E0] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(229,229,224,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          RESUME
                        </p>
                        <div className="w-full h-[5px] md:h-[10px] bg-[rgba(229,229,224,0.5)]" />
                      </div>
                    </button>

                    {/* TODO: substituir 14 anos por valor computado referente ao meu tempo de experiência */}
                    <p className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic">
                      I am a strongly committed and self-taught professional who
                      has been engaged in software development for more than a
                      decade, working in various business niches worldwide.
                    </p>
                  </div>

                  <div className="flex flex-col w-full gap-[5px]">
                    {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                    <button
                      type="button"
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#0072B1] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(0,114,177,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          LINKEDIN
                        </p>
                        <div className="w-full h-[5px] md:h-[10px] bg-[rgba(0,114,177,0.5)] lg:bg-[#72ABC8]" />
                      </div>
                    </button>

                    {/* <p className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic">
                      My profound knowledge across the technical realm, coupled with natural creativity and a thirst for results, establishes a fast-paced, delivery-oriented professional profile.
                    </p> */}
                  </div>

                  <div className="flex flex-col w-full gap-[5px]">
                    {/* TODO: sanfonar botões (e animar suas barras de progresso) a cada 5s, mudando também a imagem de fundo */}
                    <button
                      type="button"
                      className="flex flex-row h-[35px] md:h-[80px] cursor-pointer"
                      onClick={open}
                    >
                      <div className="h-full w-[5px] md:w-[10px] bg-[#128C7E] inline-block" />

                      <div className="flex flex-col justify-between w-full h-full bg-[rgba(18,140,126,0.5)] text-start">
                        <p className="grow pl-[5px] content-center font-jakarta-sans text-[16px] md:text-[32px] text-white font-bold">
                          CONTACT ME
                        </p>
                        <div className="w-full h-[5px] md:h-[10px] bg-[rgba(18,140,126,0.5)] lg:bg-[#46A296]" />
                      </div>
                    </button>

                    {/* <p className="text-[14px] md:text-[22px] text-white font-spectral font-normal italic">
                      If you&#x27;re interested, I&#x27;d be glad to schedule a call.
                    </p> */}
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
