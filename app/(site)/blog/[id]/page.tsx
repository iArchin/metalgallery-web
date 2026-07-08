import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articlesRepo } from "@/lib/server/repos";
import { toPersianNumber } from "@/app/utils/numbers";
import { toyImage } from "@/app/utils/images";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await articlesRepo.get(parseInt(id));
  return {
    title: article?.title ?? "مقاله",
    description: article?.excerpt,
    openGraph: article
      ? {
          title: article.title,
          description: article.excerpt,
          type: "article",
          publishedTime: article.date,
          authors: [article.author],
          images: [
            {
              url: toyImage(article.imageKeyword, article.imageLock, 1200, 630),
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ],
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  const article = await articlesRepo.get(parseInt(id));

  if (!article || !article.published) notFound();

  const relatedArticles = (await articlesRepo.list())
    .filter((a) => a.published && a.id !== article.id)
    .slice(0, 3);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="مسیر صفحه"
        className="max-w-4xl mx-auto text-xs sm:text-sm text-content-muted"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="hover:text-primary active:text-primary transition-colors"
            >
              خانه
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/blog"
              className="hover:text-primary active:text-primary transition-colors"
            >
              بلاگ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-content line-clamp-1">{article.title}</li>
        </ol>
      </nav>

      {/* Article header */}
      <header className="max-w-4xl mx-auto mt-6 md:mt-8">
        <span className="inline-block bg-primary-soft text-primary rounded-full px-3 py-1 text-xs font-bold">
          {article.category}
        </span>
        <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold leading-snug text-content">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-content-muted">
          <span className="font-medium text-content">{article.author}</span>
          <span aria-hidden="true">·</span>
          <span>{article.date}</span>
          <span aria-hidden="true">·</span>
          <span>{toPersianNumber(article.readingMinutes)} دقیقه مطالعه</span>
        </div>
      </header>

      {/* Hero image */}
      <div className="max-w-4xl mx-auto mt-6 md:mt-8">
        <div className="overflow-hidden rounded-2xl bg-surface-2 border border-border">
          <img
            src={toyImage(article.imageKeyword, article.imageLock, 900, 600)}
            alt={article.title}
            loading="lazy"
            className="w-full h-56 sm:h-96 object-cover"
          />
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto mt-8 md:mt-12">
        <div className="space-y-6">
          {article.content.map((paragraph, index) => (
            <p
              key={index}
              className="text-content-muted leading-8 text-base sm:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Back to blog */}
        <div className="mt-10 pt-6 border-t border-border">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 min-h-10 text-sm font-bold text-primary hover:opacity-80 active:opacity-70 transition-opacity"
          >
            <span aria-hidden="true">→</span>
            بازگشت به بلاگ
          </Link>
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-4xl mx-auto mt-12 md:mt-16">
          <h2 className="text-xl sm:text-2xl font-extrabold text-content">
            مقالات مرتبط
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.id}`}
                className="group bg-surface border border-border rounded-2xl shadow-sm transition-colors overflow-hidden"
              >
                <div className="h-36 sm:h-40 overflow-hidden bg-surface-2">
                  <img
                    src={toyImage(related.imageKeyword, related.imageLock, 900, 600)}
                    alt={related.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs font-bold text-primary">
                    {related.category}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-content leading-6 line-clamp-2 group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-2 text-xs text-content-muted">
                    {toPersianNumber(related.readingMinutes)} دقیقه مطالعه
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
