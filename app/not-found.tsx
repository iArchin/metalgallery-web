import NotFoundContent from "@/app/components/NotFoundContent";

/**
 * 404 for a URL that matches no route at all — a typo, a stale external link, a
 * crawler guess. Without this, those fall through to Next's built-in page,
 * which is English and left-to-right in the middle of an RTL site.
 *
 * It renders under the root layout only, so it has no navbar or footer; the
 * (site) copy covers notFound() thrown from inside the storefront.
 */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl">
      <NotFoundContent />
    </main>
  );
}
