import type { Metadata } from "next";
import {
  Domine,
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Quicksand,
  Spectral,
} from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fonts = `${geistSans.variable} ${geistMono.variable} ${spectral.variable} ${domine.variable} ${quicksand.variable} ${plusJakartaSans.variable}`;

  return (
    <html lang="en">
      <body className={` ${fonts} antialiased`}>{children}</body>
    </html>
  );
}
