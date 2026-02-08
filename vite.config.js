import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        creativelab: resolve(__dirname, "pillars/creative-lab/index.html"),
        opensource: resolve(__dirname, "pillars/open-source/index.html"),
        soundscape: resolve(__dirname, "pillars/soundscape/index.html"),
        interactive: resolve(__dirname, "pillars/interactive-art/index.html"),
        knowledge: resolve(__dirname, "pillars/knowledge/index.html"),
        community: resolve(__dirname, "pillars/community/index.html"),
        profile: resolve(__dirname, "pillars/community/profile.html"),
        authSuccess: resolve(__dirname, "auth-success.html"),
        authError: resolve(__dirname, "auth-error.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
