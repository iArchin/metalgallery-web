import NotFoundContent from "@/app/components/NotFoundContent";

/**
 * 404 for notFound() thrown inside the storefront — a missing or deactivated
 * category, product or article. Renders with the navbar and footer, so the
 * visitor can carry on browsing.
 */
export default function SiteNotFound() {
  return (
    <main className="site-container">
      <NotFoundContent />
    </main>
  );
}
