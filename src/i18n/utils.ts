import { DEFAULT_LANG, LANGS, UI, type Lang, type UIKey } from './ui';

export function isLang(value: string | undefined): value is Lang {
	return !!value && value in LANGS;
}

/** The page language, from Astro's i18n routing (`/it/...` → `it`). */
export function getLang(currentLocale: string | undefined): Lang {
	return isLang(currentLocale) ? currentLocale : DEFAULT_LANG;
}

/** Returns a translate function. `{name}` placeholders are filled from `vars`. */
export function useTranslations(lang: Lang) {
	return function t(key: UIKey, vars: Record<string, string | number> = {}) {
		const s = UI[lang][key] ?? UI[DEFAULT_LANG][key];
		return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
	};
}

/** Prefixes a site path with the language (`/posts/` → `/it/posts/`). English has no prefix. */
export function localizePath(lang: Lang, path: string): string {
	const clean = path.startsWith('/') ? path : `/${path}`;
	return lang === DEFAULT_LANG ? clean : `/${lang}${clean}`;
}

/** Removes the language prefix from a path (`/it/posts/` → `/posts/`). */
export function stripLang(path: string): string {
	const [, first, ...rest] = path.split('/');
	return isLang(first) && first !== DEFAULT_LANG ? `/${rest.join('/')}` : path;
}

export function formatDate(date: Date, lang: Lang): string {
	return new Intl.DateTimeFormat(LANGS[lang].locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}
