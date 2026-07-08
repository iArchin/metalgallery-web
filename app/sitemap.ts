import type { MetadataRoute } from "next";
import { listProducts, articlesRepo } from "@/lib/server/repos";

const BASE_URL = "https://metalgallery.ir";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Product routes
  const products = await listProducts();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.active)
    .map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // Blog routes
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await articlesRepo.list();
    blogRoutes = articles
      .filter((a) => a.published)
      .map((a) => ({
        url: `${BASE_URL}/blog/${a.id}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch {}

  // News routes (listing only — no individual news detail pages exist)
  // The /news page itself is already listed as a static route above.

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
