import {
  siteAddresses,
  sitePhones,
  type SiteSettings,
} from "@/lib/types";

/**
 * Organization structured data for SEO, built from the live settings.
 *
 * It used to be a block of literals inlined in the ROOT layout — which is why
 * a phone number changed in the panel never reached the page source, and read
 * as a caching problem. Fed from the database it now tracks every save, and it
 * lives under (site) so the admin panel does not carry storefront markup.
 */
export default function JsonLdOrganization({
  settings,
}: {
  settings: SiteSettings;
}) {
  const phones = sitePhones(settings);
  const addresses = siteAddresses(settings);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName || "متال گالری",
    alternateName: "Metal Gallery",
    url: "https://metalgallery.ir",
    logo: "https://metalgallery.ir/images/logo.png",
    description: settings.tagline || undefined,
    email: settings.email || undefined,
    // schema.org takes arrays here, so every listed number is published, and
    // contactType carries the landline/mobile distinction machine-readably.
    telephone: phones.map((p) => p.value),
    contactPoint: phones.map((p) => ({
      "@type": "ContactPoint",
      telephone: p.value,
      contactType: p.kind === "whatsapp" ? "customer support" : "customer service",
      areaServed: "IR",
      availableLanguage: ["Persian", "English"],
    })),
    address: addresses.map((a) => ({
      "@type": "PostalAddress",
      streetAddress: a.value,
      addressCountry: "IR",
    })),
    openingHours: settings.workingHours || undefined,
    sameAs: [
      settings.socials.instagram,
      settings.socials.twitter,
      settings.socials.facebook,
      settings.socials.linkedin,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
