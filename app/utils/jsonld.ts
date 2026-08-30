/**
 * Serialize a value for injection into a `<script type="application/ld+json">`.
 *
 * JSON.stringify does not escape `<`, so a value containing `</script>` closes
 * the element and everything after it is parsed as HTML. These blocks carry
 * admin-editable text — shop name, tagline, addresses, product names — so that
 * is a real path from the panel to script injection on every storefront page.
 * `<` is a valid JSON escape for `<` and parses back to the same string,
 * so the structured data itself is unchanged.
 */
export function jsonLdScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
