import type { Metadata } from "next";
import { AppProviders } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "Petassist — ぺたしすと",
  description:
    "ペットをモニターに貼る。許可が見える。仕事は MCP、安全は TrueForge、顔は Petassist。外に出せるのは犬だけで、それも Allow のあとだけ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
