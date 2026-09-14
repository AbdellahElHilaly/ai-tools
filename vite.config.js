import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/ai-tools/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "AI Tools",
        short_name: "AI Tools",
        description: "أدوات ذكية صغيرة تساعدك على التعلم والعمل.",
        theme_color: "#f7f7f4",
        background_color: "#f7f7f4",
        display: "standalone",
        lang: "ar",
        dir: "rtl",
        start_url: "/ai-tools/#/",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true
  }
});
