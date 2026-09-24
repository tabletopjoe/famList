/** A bare domain (e.g. "example.com/recipe") would otherwise resolve relative to this app's own origin. */
export function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
