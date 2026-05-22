import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://sola-ryu.github.io/wevenue',
  base: '/wevenue/',
  integrations: [tailwind()],
});
