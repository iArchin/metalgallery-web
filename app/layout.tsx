import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import ThemeScript from "./components/ThemeScript";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "متال گالری - فروشگاه اسباب‌بازی و اکشن فیگور",
  description:
    "خرید آنلاین اسباب‌بازی، اکشن فیگور و لباس کودکان - جدیدترین‌ها با بهترین قیمت و تا ۱۰٪ تخفیف",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-theme="light"
      suppressHydrationWarning
      className={vazirmatn.variable}
    >
      <body className={`${vazirmatn.className} antialiased font-sans bg-background text-content`}>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
