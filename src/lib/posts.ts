import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Post = CollectionEntry<'posts'>;

// Posts live in src/content/posts/<lang>/<slug>.md, so an entry id is "<lang>/<slug>".
// A translation shares the same slug in the other language folder.

export function postLang(post: Post): Lang {
	return post.id.split('/')[0] as Lang;
}

export function postSlug(post: Post): string {
	return post.id.split('/').slice(1).join('/');
}

/** Published posts in one language, newest first. Drafts are only shown in `astro dev`. */
export async function getPosts(lang: Lang): Promise<Post[]> {
	const posts = await getCollection(
		'posts',
		(post) => postLang(post) === lang && (import.meta.env.DEV || !post.data.draft),
	);
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function readingTime(body = ''): number {
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 220));
}
