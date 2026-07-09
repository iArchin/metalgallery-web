import Link from "next/link";
import { articlesRepo } from "@/lib/server/repos";
import { toyImage } from "@/app/utils/images";

export default async function LatestNews() {
  const latest = (await articlesRepo.list())
    .filter((a) => a.published)
    .sort((a, b) => b.id - a.id) // newest first
    .slice(0, 3);

  if (latest.length === 0) return null;

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-10 flex items-end justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content">
            آخرین اخبار و مقالات ما
          </h2>
          <Link
            href="/blog"
            className="shrink-0 text-sm font-bold text-primary hover:text-primary-hover active:text-primary-hover transition-colors py-2"
          >
            مشاهده همه ←
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {latest.map((article) => (
            <article
              key={article.id}
              className="group bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-colors"
            >
              <Link
                href={`/blog/${article.id}`}
                className="block h-44 sm:h-48 w-full overflow-hidden bg-surface-2"
              >
                <img
                  src={toyImage(article.imageKeyword, article.imageLock, 900, 600)}
                  alt={article.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                    {article.category}
                  </span>
                  <span className="text-xs text-content-muted">
                    {article.date} · {article.author}
                  </span>
                </div>
                <h3 className="mb-2 text-base sm:text-lg font-bold leading-relaxed line-clamp-2">
                  <Link
                    href={`/blog/${article.id}`}
                    className="text-content transition-colors hover:text-primary active:text-primary"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-content-muted line-clamp-2">
                  {article.excerpt}
                </p>
                <Link
                  href={`/blog/${article.id}`}
                  className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary-hover active:text-primary-hover"
                >
                  بیشتر بخوانید ←
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
