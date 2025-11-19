import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import FloatingActions from "./components/FloatingActions";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "بیبی‌مارت - اسباب‌بازی و لباس کودکان",
  description: "خرید اسباب‌بازی و لباس کودکان - تا ۱۰% تخفیف",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={`${vazirmatn.className} antialiased font-sans`}>
        {children}
        <FloatingActions />
      </body>
    </html>
  );
}
