// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({

  site: 'https://retropix.tech',

  // Единый стиль URL без слэша в конце: /blog/post
  trailingSlash: 'never',

  compressHTML: true,

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  security: {
    checkOrigin: true,
  },

  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/thanks') &&
        !page.includes('/rss.xml') &&
        !page.includes('/leaderboard'),
      // Без serialize: не ставим фейковый lastmod.
      // Яндекс/Google игнорируют или считают манипуляцией
      // одинаковый lastmod на всех страницах.
    }),
  ],

  adapter: vercel(),
});