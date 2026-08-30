import Link from "next/link";

/**
 * The Persian 404 body, shared by the two not-found routes: the one inside
 * (site), which renders with the storefront chrome, and the root one, which
 * catches URLs matching no route at all and renders bare.
 */
export default function NotFoundContent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-4 text-6xl sm:text-7xl font-extrabold text-primary/30">۴۰۴</span>
      <h1 className="mb-3 text-2xl sm:text-3xl font-extrabold text-content">
        صفحه‌ای که دنبالش بودید پیدا نشد
      </h1>
      <p className="mb-8 max-w-md text-sm sm:text-base text-content-muted leading-relaxed">
        ممکن است آدرس را اشتباه وارد کرده باشید، یا این صفحه حذف شده باشد.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-content transition-colors hover:bg-primary-hover"
        >
          مشاهده محصولات
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-bold text-content transition-colors hover:bg-surface-2"
        >
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
