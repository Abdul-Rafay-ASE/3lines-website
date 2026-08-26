import { DIR, LOCALES, type Locale } from './blocks';

export { LOCALES, DIR };
export type { Locale };

export const DEFAULT_LOCALE: Locale = 'en';

export const isLocale = (v: string): v is Locale => (LOCALES as string[]).includes(v);

/**
 * Prefix a locale-less route id with its locale.
 *
 * Content stores route ids without a locale ("/services/x"), and the prefix is
 * applied here. That makes it structurally impossible for the Arabic tree to
 * link into the English one, and it lets the link audit assert that every
 * internal href begins with a known locale.
 *
 * External links, in-page anchors and already-prefixed paths pass through.
 */
/**
 * True for anything that leaves this site — an absolute URL, a protocol-relative
 * one, or a `mailto:`/`tel:` scheme. Lives beside `localePath` because the two
 * are the same decision: a link either gets a locale prefix or it leaves.
 */
export function isExternal(href: string | undefined): boolean {
  if (!href) return false;
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
}

export function localePath(locale: Locale, href: string | undefined): string {
  if (!href) return '#';
  if (/^[a-z]+:/i.test(href) || href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;

  const [pathPart = '', hash = ''] = href.split(/(?=#)/);
  const clean = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

  const first = clean.split('/')[1];
  if (first && isLocale(first)) return clean + hash;

  return `/${locale}${clean === '/' ? '' : clean}` + hash;
}

/** The same route id in every locale, for hreflang alternates. */
export function altPaths(route: string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, localePath(l, route)])) as Record<Locale, string>;
}
