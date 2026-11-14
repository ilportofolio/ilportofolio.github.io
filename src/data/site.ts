import type { UIKey } from '../i18n/ui';

export const SITE = {
	title: 'Blog',
	author: 'Your Name',
	email: 'hello@example.com',
};

/** Main navigation. Paths are language-neutral; they get the /it/ prefix when needed. */
export const NAV: { path: string; key: UIKey }[] = [
	{ path: '/', key: 'nav.home' },
	{ path: '/posts/', key: 'nav.posts' },
	{ path: '/projects/', key: 'nav.projects' },
];
