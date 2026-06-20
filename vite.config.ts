import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { currentUpdateMetadata } from "./src/app/update/updateMetadata";
import { SITE_BASE_PATH } from "./src/config/site";

export default defineConfig(({ command }) => {
  const base = command === "build" ? SITE_BASE_PATH : "/";

  return {
    base,

    plugins: [
      updateMetadataAssetPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        injectRegister: "auto",
        includeAssets: [
          "favicon.svg",
          "favicon-16x16.png",
          "favicon-32x32.png",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "maskable-icon-512x512.png",
        ],
        manifest: {
          name: "Метро Екатеринбурга",
          short_name: "Метро ЕКБ",
          description:
            "Время до следующего поезда и расчёт поездки в Екатеринбургском метрополитене.",
          lang: "ru",
          start_url: base,
          scope: base,
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#0B0E12",
          theme_color: "#0B0E12",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: `${base}index.html`,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],

    build: {
      target: "es2022",
      sourcemap: false,
      cssCodeSplit: true,
      reportCompressedSize: true,
    },

    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },

    preview: {
      port: 4173,
      open: true,
    },
  };
});

function updateMetadataAssetPlugin(): Plugin {
  return {
    name: "metro-update-metadata-asset",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "update-metadata.json",
        source: `${JSON.stringify(currentUpdateMetadata, null, 2)}\n`,
      });
    },
  };
}
