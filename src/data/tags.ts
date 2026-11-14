import type { Lang } from '../i18n/ui';

// Post categories. Each one becomes a filter button and a page at /tags/<id>/ (and /it/tags/<id>/).
// The names and colors are placeholders: rename them, recolor them, or add more.
export const TAGS = [
	{ id: 'yellow', label: { en: 'Yellow', it: 'Giallo' }, color: '#f5d90a' },
	{ id: 'blue', label: { en: 'Blue', it: 'Blu' }, color: '#52a8ff' },
	{ id: 'green', label: { en: 'Green', it: 'Verde' }, color: '#62c073' },
	{ id: 'red', label: { en: 'Red', it: 'Rosso' }, color: '#ff6166' },
	{ id: 'violet', label: { en: 'Violet', it: 'Viola' }, color: '#bf7af0' },
] as const;

export type TagId = (typeof TAGS)[number]['id'];

export const TAG_IDS = TAGS.map((t) => t.id) as [TagId, ...TagId[]];

export function getTag(id: string) {
	const tag = TAGS.find((t) => t.id === id);
	if (!tag) throw new Error(`Unknown tag "${id}". Add it to src/data/tags.ts.`);
	return tag;
}

export function tagLabel(id: string, lang: Lang): string {
	return getTag(id).label[lang];
}
