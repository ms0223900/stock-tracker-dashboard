import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZenTrade TW | 台股投資看板",
  description:
    "查詢即時台股股價、設定目標價、透過 Telegram 接收通知。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
