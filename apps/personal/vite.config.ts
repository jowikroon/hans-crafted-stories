import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { editSourceMap } from "./vite-plugins/editSourceMap";

/** Replace build-time placeholders in index.html (e.g. {{CURRENT_YEAR}}) */
function htmlPlaceholders(): Plugin {
  return {
    name: "html-placeholders",
    transformIndexHtml(html) {
      return html.replace(/\{\{CURRENT_YEAR\}\}/g, String(new Date().getFullYear()));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    // SSR build must not clear dist so client build + inject-static-content stay
    emptyOutDir: !process.env.BUILD_SSR,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // Alleen op de client-build. De SSR-build (scripts/build-ssr.cjs) is een
      // enkele bundle voor Node; manualChunks hoort daar niet.
      output: process.env.BUILD_SSR
        ? {}
        : {
            /**
             * Vendor-splitsing, okt 2026. Voor deze wijziging zat alles in een
             * App-chunk van 1,31 MB raw / 350 KB gz, die de homepage volledig
             * downloadde voordat er iets op het scherm stond (PSI mobiel 58,
             * LCP 10,0 s). Groeperen per package houdt het entry-chunk klein
             * en geeft lange-termijn caching: een contentwijziging invalideert
             * niet langer react, radix en framer-motion mee.
             */
            manualChunks(id: string) {
              if (!id.includes("node_modules")) return;
              // BELANGRIJK: groepeer hier alleen packages die op elke pagina
              // nodig zijn. Deze build gebruikt Vite 8 (rolldown), en die zet een
              // handmatig benoemd chunk als modulepreload in index.html. Noem je
              // hier recharts of tiptap, dan downloadt de homepage ze alsnog
              // (gemeten: +500 KB gz aan preload). Laat die aan de automatische
              // lazy-splitsing van de route-chunks.
              if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return "react";
              if (id.includes("framer-motion") || id.includes("popmotion") || id.includes("style-value-types")) return "motion";
              if (id.includes("@radix-ui") || id.includes("lucide-react")) return "ui";
              if (id.includes("@tanstack")) return "query";
            },
          },
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // editSourceMap: data-src tags + /__edit/source-map.json for the edit overlay's
  // write-back to source (see src/lib/editSource/). Text only, no DOM/visual change.
  plugins: [editSourceMap({ root: __dirname }), react(), htmlPlaceholders(), componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
