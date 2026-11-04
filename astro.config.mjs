import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// Every page is rendered to static HTML at build time (one file per address, e.g. /comprendre -> comprendre.html,
// served without the extension by Vercel's cleanUrls), then the React island takes over in the browser.
export default defineConfig({
  site: 'https://monsalaire.aconta.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react()],
  server: { port: 3150 },
  devToolbar: { enabled: false },
});
