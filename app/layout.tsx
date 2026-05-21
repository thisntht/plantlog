import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlantLog",
  description: "부담 없이 식물을 관찰하고 물주기를 기록하는 개인용 로그 앱",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4faf5"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
