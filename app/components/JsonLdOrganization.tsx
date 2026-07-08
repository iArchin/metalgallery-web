/**
 * JSON-LD Organization structured data for SEO.
 * Renders as a <script type="application/ld+json"> in the document head area.
 */
export default function JsonLdOrganization() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "متال گالری",
    alternateName: "Metal Gallery",
    url: "https://metalgallery.ir",
    logo: "https://metalgallery.ir/images/logo.png",
    description:
      "فروشگاه تخصصی اسباب‌بازی و اکشن فیگور - خرید آنلاین با ضمانت اصالت کالا و ارسال سریع",
    foundingDate: "1395",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "021-12345678",
      email: "info@metalgallery.ir",
      availableLanguage: ["Persian", "English"],
    },
    sameAs: [
      "https://facebook.com/metalgallery",
      "https://twitter.com/metalgallery",
      "https://instagram.com/metalgallery",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
