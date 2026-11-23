import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    target: "es2020",
    assetsInlineLimit: () => true,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
});
