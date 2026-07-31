import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const viteConfig = defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
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

const vitestConfig = defineVitestConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,

    coverage: {
      provider: "v8",
      reporter: [
        "text",
        "html",
        "lcov"
      ],
      reportsDirectory: "../Testing/frontend/coverage",
    },
  },
});

export default mergeConfig(viteConfig, vitestConfig);
