import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },

  // server: {
  //     host: "0.0.0.0",
  //     proxy: {
  //         "/fineract-provider": {
  //             target: "https://localhost:8443",
  //             changeOrigin: true,
  //             secure: false,
  //         },
  //     },
  // },
});
