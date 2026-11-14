// Sitemap for search engines, with hreflang pairs linking each page to its translation.
// Only pages that really exist in a language are listed (no empty tag pages, no 404).
import type { APIRoute } from 'astro';
import { TAGS } from '../data/tags';
import { DEFAULT_LANG, LANGS, type Lang } from '../i18n/ui';
import { localizePath } from '../i18n/utils';
import { getPosts, postSlug, type Post } from '../lib/posts';

interface Entry {
	/** Language-neutral path, e.g. /posts/foo/ */
	path: string;
	/** Languages this page exists in. */
	langs: Lang[];
	lastmod?: (lang: Lang) => Date | undefined;
}

const langs = Object.keys(LANGS) as Lang[];

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('Set `site` in astro.config.mjs to build the sitemap.');
	const abs = (lang: Lang, path: string) => new URL(localizePath(lang, path), site).href;

	const postsByLang = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await getPosts(l)] as const))) as Record<
		Lang,
		Post[]
	>;
	const newest = (posts: Post[]) => posts[0] && (posts[0].data.updated ?? posts[0].data.date);
	const listLastmod = (l: Lang) => newest(postsByLang[l]);

	const entries: Entry[] = [
		{ path: '/', langs, lastmod: listLastmod },
		{ path: '/posts/', langs, lastmod: listLastmod },
		{ path: '/projects/', langs },
		...TAGS.map((tag) => {
			const tagged = (l: Lang) => postsByLang[l].filter((p) => p.data.tags.includes(tag.id));
			return {
				path: `/tags/${tag.id}/`,
				langs: langs.filter((l) => tagged(l).length > 0),
				lastmod: (l: Lang) => newest(tagged(l)),
			};
		}),
	];

	// Posts, paired with their translation by file name.
	const slugs = new Set(langs.flatMap((l) => postsByLang[l].map(postSlug)));
	for (const slug of slugs) {
		const find = (l: Lang) => postsByLang[l].find((p) => postSlug(p) === slug);
		entries.push({
			path: `/posts/${slug}/`,
			langs: langs.filter((l) => find(l)),
			lastmod: (l) => {
				const post = find(l);
				return post && (post.data.updated ?? post.data.date);
			},
		});
	}

	const urls = entries.flatMap((entry) =>
		entry.langs.map((lang) => {
			const lastmod = entry.lastmod?.(lang);
			const alternates =
				entry.langs.length > 1
					? [
							...entry.langs.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(l, entry.path)}"/>`),
							...(entry.langs.includes(DEFAULT_LANG)
								? [`<xhtml:link rel="alternate" hreflang="x-default" href="${abs(DEFAULT_LANG, entry.path)}"/>`]
								: []),
						]
					: [];
			return [
				'<url>',
				`<loc>${abs(lang, entry.path)}</loc>`,
				lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : '',
				...alternates,
				'</url>',
			].join('');
		}),
	);

	const xml =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
		urls.join('\n') +
		'\n</urlset>\n';

	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
