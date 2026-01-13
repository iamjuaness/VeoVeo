import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "VeoVeo",
        short_name: "VeoVeo",
        description: "Tu red social de cine y series",
        theme_color: "#0ea5e9",
        icons: [
          {
            src: "pelicula-de-video.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pelicula-de-video.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      host: "localhost",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-charts": ["recharts"],
          "vendor-pdf": ["jspdf", "html2canvas"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
