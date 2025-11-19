import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Babymart - Children's Toys and Clothes",
  description: "Buy Children's Toys And Clothes - Up to 10% OFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={inter.className}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
