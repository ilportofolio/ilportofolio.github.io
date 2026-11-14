// getStaticPaths builders shared by the English and Italian route files.
import { TAGS } from '../data/tags';
import type { Lang } from '../i18n/ui';
import { getPosts, postSlug, type Post } from './posts';

export interface PostPageProps {
	post: Post;
	newer?: Post;
	older?: Post;
	related: Post[];
	/** Slug exists in the other languages too (used by the language switcher). */
	translatedIn: Lang[];
}

export async function postPaths(lang: Lang, otherLangs: Lang[]) {
	const posts = await getPosts(lang);
	const others = await Promise.all(otherLangs.map(async (l) => [l, new Set((await getPosts(l)).map(postSlug))] as const));
	return posts.map((post, i) => {
		const props: PostPageProps = {
			post,
			newer: posts[i - 1],
			older: posts[i + 1],
			related: posts
				.filter((p) => p.id !== post.id && p.data.tags.some((t) => post.data.tags.includes(t)))
				.slice(0, 2),
			translatedIn: others.filter(([, slugs]) => slugs.has(postSlug(post))).map(([l]) => l),
		};
		return { params: { slug: postSlug(post) }, props };
	});
}

export function tagPaths() {
	// One page per declared tag, including tags with no posts yet.
	return TAGS.map((tag) => ({ params: { tag: tag.id } }));
}
