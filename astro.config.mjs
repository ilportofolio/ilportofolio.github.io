// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const geist = './node_modules/geist/dist/fonts';

// https://astro.build/config
export default defineConfig({
	// Published on GitHub Pages by .github/workflows/deploy.yml
	site: 'https://ilportofolio.github.io',
	// English at /, Italian at /it/. UI strings live in src/i18n/ui.ts.
	i18n: {
		locales: ['en', 'it'],
		defaultLocale: 'en',
		routing: { prefixDefaultLocale: false },
	},
	fonts: [
		{
			// Display font: Geist Pixel (Square variant), as on vercel.com/font?type=pixel
			provider: fontProviders.local(),
			name: 'Geist Pixel',
			cssVariable: '--font-pixel',
			fallbacks: ['monospace'],
			options: {
				variants: [
					{ weight: 500, style: 'normal', src: [`${geist}/geist-pixel/GeistPixel-Square.woff2`] },
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Geist',
			cssVariable: '--font-sans',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{ weight: '100 900', style: 'normal', src: [`${geist}/geist-sans/Geist-Variable.woff2`] },
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Geist Mono',
			cssVariable: '--font-mono',
			fallbacks: ['monospace'],
			options: {
				variants: [
					{ weight: '100 900', style: 'normal', src: [`${geist}/geist-mono/GeistMono-Variable.woff2`] },
				],
			},
		},
	],
});
