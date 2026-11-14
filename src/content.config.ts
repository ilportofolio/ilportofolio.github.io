import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { TAG_IDS } from './data/tags';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		updated: z.coerce.date().optional(),
		// Every tag must be declared in src/data/tags.ts so it gets a filter button.
		tags: z.array(z.enum(TAG_IDS)).min(1),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
