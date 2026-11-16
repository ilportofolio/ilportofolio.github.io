import type { UIKey } from '../i18n/ui';

export const SITE = {
	title: 'Adonay Haile Ogbazghi',
	author: 'Adonay Haile Ogbazghi',
	email: 'adonayhaile@proton.me',
	linkedin: 'https://www.linkedin.com/in/adonay-haile-ogbazghi',
	linkedinLabel: 'linkedin.com/in/adonay-haile-ogbazghi',
};

/** Main navigation. Paths are language-neutral; they get the /it/ prefix when needed. */
export const NAV: { path: string; key: UIKey }[] = [
	{ path: '/', key: 'nav.home' },
	{ path: '/posts/', key: 'nav.posts' },
	{ path: '/projects/', key: 'nav.projects' },
];
