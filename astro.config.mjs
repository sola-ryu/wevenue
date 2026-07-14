import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: "https://sola-ryu.github.io/wevenue",
  base: "/wevenue/",
  output: 'server',
  adapter: cloudflare({
    assets: {
      binding: 'MY_ASSETS',
    },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
