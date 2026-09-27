/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Only SERVER_PORT is read here, to point the dev proxy at the backend.
  // Secrets are never loaded into the client bundle: Vite exposes only
  // VITE_-prefixed variables, and OPENAI_API_KEY is not one of them.
  const env = loadEnv(mode, process.cwd(), "");
  const serverPort = env.SERVER_PORT || "3001";
  const demoMode =
    process.env.VITE_DEMO_MODE === "true" || env.VITE_DEMO_MODE === "true";

  return {
    // Relative asset paths so the demo works on GitHub Pages project sites.
    base: demoMode ? "./" : "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "server/**/*.test.ts"],
    },
  };
});
