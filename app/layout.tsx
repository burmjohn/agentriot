import type { Metadata } from "next";
import { Anton, Space_Grotesk, Space_Mono, Newsreader } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-info";
import { ThemeProvider } from "@/components/ui/theme-provider";

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

const themeScript = `(function() {
  try {
    const theme = localStorage.getItem('agentriot-theme');
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = prefersDark ? 'dark' : 'light';
      document.documentElement.classList.add(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    }
  } catch (e) {
    // localStorage or matchMedia not available
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
