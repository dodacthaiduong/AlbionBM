import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode !== "production";
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET?.trim();

  return {
    plugins: [react()],
    server: isDev
      ? {
          proxy: {
            "/api": proxyTarget,
          },
        }
      : undefined,
  };
});
