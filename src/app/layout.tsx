import type { Metadata } from "next";
import { AppProviders } from "@/components/providers";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const title = "Petassist, stuck on the desk — research only, drafts only, this folder only";
const description =
  "Stickable AI agents on the desk — so you can manage the work. Research only, drafts only, this folder only. Hand over only what’s needed.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: title,
    template: "%s — Petassist",
  },
  description,
  keywords: [
    "Petassist",
    "stickable AI agents",
    "permissions",
    "desk",
    "TrueForge",
    "MCP",
  ],
  authors: [{ name: "Petassist" }],
  icons: {
    icon: "/party/cat/02.png",
    shortcut: "/party/cat/02.png",
    apple: "/party/cat/02.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    title,
    description,
    siteName: "Petassist",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
