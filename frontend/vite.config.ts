import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno desde .env
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        // Si usas SCSS/SASS
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
    server: {
      host: true, // Permite acceder desde Docker o LAN
      port: 5173,
    },
    define: {
      "process.env": env, // Permite usar import.meta.env o process.env.VITE_API_URL
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: undefined, // puedes configurar si quieres code splitting
        },
      },
    },
    base: env.VITE_BASE_URL || "/", // útil si despliegas en subdominio
  };
});
