import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    chunkSizeWarningLimit: 2500,
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), htmlPlaceholders(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
