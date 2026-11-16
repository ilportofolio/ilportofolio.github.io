import type { Lang } from '../i18n/ui';

// Post categories. Each one becomes a filter button and a page at /tags/<id>/ (and /it/tags/<id>/).
export const TAGS = [
	{ id: 'soc', label: { en: 'SOC', it: 'SOC' }, color: '#52a8ff' },
	{ id: 'detection', label: { en: 'Detection', it: 'Detection' }, color: '#62c073' },
	{ id: 'malware', label: { en: 'Malware analysis', it: 'Analisi malware' }, color: '#ff6166' },
	{ id: 'lab', label: { en: 'Home lab', it: 'Laboratorio' }, color: '#f5d90a' },
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
