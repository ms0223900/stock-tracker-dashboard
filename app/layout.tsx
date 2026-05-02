import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "股價投資看板｜Stock Watch MVP",
  description:
    "輸入台股代號與目標價，查詢即時股價、儲存追蹤條件，達標時透過 Telegram 通知的課程用 MVP。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
