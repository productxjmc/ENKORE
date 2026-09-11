// JSON.stringify doesn't escape "<" — a musician-supplied name or bio
// containing "</script>" would otherwise break out of the script tag
// this gets injected into via dangerouslySetInnerHTML. The standard fix
// for JSON-LD embedded in HTML: escape "<" to its unicode form, which
// JSON parsers treat identically but browsers can't interpret as markup.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
