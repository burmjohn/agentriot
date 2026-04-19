import type { Metadata } from "next";
import { Anton, Space_Grotesk, Space_Mono, Newsreader } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-info";

import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${newsreader.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#131313]">{children}</body>
    </html>
  );
}
