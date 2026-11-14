# Blog

A bilingual (English / Italian) blog built with [Astro](https://astro.build), set in the Geist font family on a black, glass-card design.

- English lives at `/`, Italian at `/it/`.
- Posts are filtered by tag: every tag gets a button and a page at `/tags/<tag>/` (and `/it/tags/<tag>/`).

## Commands

Run from the project root (Node 22+):

| Command           | What it does                                   |
| :---------------- | :--------------------------------------------- |
| `npm install`     | Install dependencies                           |
| `npm run dev`     | Dev server at `http://localhost:4321`          |
| `npm run build`   | Build the static site into `dist/`             |
| `npm run preview` | Serve the built site locally                   |
| `npx astro check` | Type-check `.astro` and `.ts` files            |

In `npm run dev`, the Astro toolbar at the bottom of the page has an **Audit** app that checks the current page for accessibility and performance issues.

## Writing a post

Create a Markdown file in `src/content/posts/en/`. The file name becomes the URL (`my-post.md` → `/posts/my-post/`).

```md
---
title: "My post"
description: "One or two sentences shown on the card and under the title."
date: 2026-11-14
tags: [yellow, blue]
# updated: 2026-11-20   optional
# draft: true           optional: shown in `npm run dev`, left out of the build
---

Post body in Markdown. `##` and `###` headings appear in the table of contents.
```

### Translating a post

Put the Italian version in `src/content/posts/it/` **with the same file name**. The EN/IT switch then links the two. A post that exists in only one language is fine: the switch sends readers to the other language's post list instead.

## Tags

Tags are declared in `src/data/tags.ts`, each with an id, an English and Italian label, and a color:

```ts
{ id: 'yellow', label: { en: 'Yellow', it: 'Giallo' }, color: '#f5d90a' },
```

A post can only use declared tag ids; a typo fails the build instead of silently hiding the post. Adding a tag here creates its filter button and pages automatically.

## Interface text and languages

- Interface strings (menu, buttons, labels) are in `src/i18n/ui.ts`, one block per language.
- Helpers for the current language, translated strings and localized links are in `src/i18n/utils.ts`.
- Each page has a thin route file for each language (`src/pages/…` and `src/pages/it/…`) that renders a shared view from `src/views/`.

## Design

- Colors, glass surfaces, radii and widths are CSS variables at the top of `src/styles/global.css`.
- Fonts (Geist Pixel, Geist Sans, Geist Mono) are loaded locally from the `geist` package through the Astro Fonts API in `astro.config.mjs`.

## Publishing

The site is published at <https://ilportofolio.github.io> by `.github/workflows/deploy.yml`, which builds and deploys on every push to `main`. One-time setup: in the GitHub repository, **Settings → Pages → Source: GitHub Actions**.

`site` in `astro.config.mjs` holds that address; it is used for canonical, `og:url` and `hreflang` links.

### Search engines

- `/sitemap.xml` lists every page with its translation (hreflang), and `/robots.txt` points to it. Both are generated from the posts, so they stay current.
- A post without a translation is listed only in its own language; it is never paired with the other language's post list.
- Posts carry article metadata and schema.org `BlogPosting` data (language, dates, tags, author); the home page carries `WebSite` data.
- The 404 page and tag pages with no posts are marked `noindex`.
- After the first deploy, add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://ilportofolio.github.io/sitemap.xml`.

Before going public:

- Replace the placeholders in `src/data/site.ts` (name, email), the tags, and the lorem ipsum posts and projects.

## Structure

```text
src/
├── components/    Header, Footer, PostCard, PostGrid, PostsIndex, TagChip, TagFilter
├── content/posts/ en/ and it/ Markdown posts
├── data/          site.ts (name, nav), tags.ts
├── i18n/          ui.ts (strings), utils.ts (helpers)
├── layouts/       Layout.astro (head, header, footer)
├── lib/           posts.ts (queries), paths.ts (static paths)
├── pages/         English routes, it/ Italian routes, 404
├── styles/        global.css (tokens, glass, base)
└── views/         Page bodies shared by both languages
```
