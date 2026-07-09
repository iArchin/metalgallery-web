import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeScript from "./components/ThemeScript";

// Vazirmatn is vendored (app/fonts, SIL OFL) rather than pulled from
// next/font/google, which downloads from fonts.gstatic.com during `next build`.
// A build host that can't reach Google — which is the norm for an Iranian
// server — would otherwise hang or fail. One variable file carries the whole
// 300–800 range plus both the Arabic and Latin glyphs.
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  weight: "300 800",
  style: "normal",
  display: "swap",
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://metalgallery.ir"),
  title: {
    default: "متال گالری | فروشگاه اسباب‌بازی، اکشن فیگور و ماکت",
    template: "%s | متال گالری",
  },
  description:
    "خرید آنلاین اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه. ارسال رایگان به سراسر کشور، ضمانت اصالت کالا و بازگشت ۷ روزه. متال گالری - دنیای اسباب‌بازی‌های شما",
  keywords: [
    "اسباب‌بازی", "فروشگاه اسباب‌بازی", "اکشن فیگور", "ماکت", "فروشگاه ماکت",
    "خرید اسباب‌بازی", "فروشگاه اکشن فیگور", "toy shop", "figure shop",
    "market shop", "متال گالری", "metal gallery", "لگو", "عروسک",
    "ماشین کنترلی", "بازی فکری", "پازل", "لباس کودک",
  ],
  authors: [{ name: "متال گالری" }],
  creator: "متال گالری",
  publisher: "متال گالری",
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://metalgallery.ir",
    siteName: "متال گالری",
    title: "متال گالری | فروشگاه اسباب‌بازی، اکشن فیگور و ماکت",
    description:
      "خرید آنلاین اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه. ارسال رایگان، ضمانت اصالت کالا.",
    images: [{ url: "/images/logo.png", width: 250, height: 250, alt: "متال گالری" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "متال گالری | فروشگاه اسباب‌بازی، اکشن فیگور و ماکت",
    description:
      "خرید آنلاین اسباب‌بازی، اکشن فیگور، ماکت و لباس کودک با بهترین قیمت و تخفیف ویژه",
    images: ["/images/logo.png"],
  },
  alternates: { canonical: "https://metalgallery.ir" },
  verification: {
    google: "google-site-verification-code", // Replace with actual code
  },
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
        {/* JSON-LD Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "متال گالری",
              alternateName: "Metal Gallery",
              url: "https://metalgallery.ir",
              logo: "https://metalgallery.ir/images/logo.png",
              description: "فروشگاه آنلاین اسباب‌بازی، اکشن فیگور و ماکت",
              email: "info@metalgallery.ir",
              telephone: "021-12345678",
              address: {
                "@type": "PostalAddress",
                addressCountry: "IR",
                addressLocality: "تهران",
              },
              sameAs: [
                "https://instagram.com/metalgallery",
                "https://twitter.com/metalgallery",
              ],
            }),
          }}
        />
        {/* JSON-LD for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "متال گالری",
              url: "https://metalgallery.ir",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://metalgallery.ir/products?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
