import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Path aliases (@, @app, @routes, etc.) are defined once in
// tsconfig.json's "paths" and synced into Vite automatically by
// vite-tsconfig-paths, so there's no risk of the two configs
// drifting out of sync or of prefix-collision bugs from manually
// listing overlapping "@..." keys in resolve.alias.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Manual chunking so route-level code splitting produces
        // sensible vendor bundles instead of one giant chunk.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "graph-vendor": ["reactflow"],
          "chart-vendor": ["recharts"],
        },
      },
    },
  },
});

