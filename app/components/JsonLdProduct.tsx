import type { Product } from "@/lib/types";

/**
 * JSON-LD Product structured data for SEO.
 * Renders as a <script type="application/ld+json">.
 */
export default function JsonLdProduct({ product }: { product: Product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: `MG-${product.id}`,
    image: product.image
      ? `https://metalgallery.ir${product.image}`
      : `https://images.unsplash.com/photo-${product.imageLock}?w=600&h=600&fit=crop`,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "متال گالری",
      },
    },
    aggregateRating: product.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
    brand: {
      "@type": "Brand",
      name: "متال گالری",
    },
  };

  // Remove undefined keys
  const clean = JSON.parse(JSON.stringify(jsonLd));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  );
}
