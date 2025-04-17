import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

const DEV_PORT = 7676;

// https://astro.build/config
export default defineConfig({
	site: process.env.CI ? 'https://0.0.0.0' : `http://localhost:${DEV_PORT}`,
	base: process.env.CI ? '/front-end' : undefined,

	output: 'server',

	/* Like Vercel, Netlify,… Mimicking for dev. server */
	// trailingSlash: 'always',

	server: {
		/* Dev. server only */
		port: DEV_PORT,
	},

	integrations: [
		//
		sitemap(),
		tailwind(),
	],
});
