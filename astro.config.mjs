import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://sola-ryu.github.io/wevenue",
  base: "/wevenue/",
  vite: {
    plugins: [tailwindcss()],
  },
});
