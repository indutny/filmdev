import { defineConfig } from "vite";

export default defineConfig({
  base: 'https://indutny.github.io/filmdev',
  build: {
    assetsInlineLimit: 256 * 1024,
  },
});
