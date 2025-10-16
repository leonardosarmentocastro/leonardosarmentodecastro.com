import type { Metadata } from "next";
import {
  Domine,
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Quicksand,
  Spectral,
} from "next/font/google";
import Head from "next/head";

// global styles
/////
import "./globals.css";

// @mantine
/////
// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import { useGSAP } from "@gsap/react";
import {
  ColorSchemeScript,
  createTheme,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
// GSAP (animations library)
/////
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

// fonts
/////
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const domine = Domine({
  variable: "--font-domine",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leonardo Sarmento de Castro",
  description: "Personal website of Leonardo Sarmento de Castro",
};

// @mantine
/////
const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fonts = `${geistSans.variable} ${geistMono.variable} ${spectral.variable} ${domine.variable} ${quicksand.variable} ${plusJakartaSans.variable}`;

  return (
    <html lang="en" {...mantineHtmlProps}>
      <Head>
        <ColorSchemeScript />
      </Head>

      <body className={` ${fonts} antialiased`}>
        <MantineProvider theme={theme}>
          <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
