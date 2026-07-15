import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },

    server: {
        host: "0.0.0.0",
        port: 4173,
        allowedHosts: ["https://e1a9-202-137-134-22.ngrok-free.app"],
        proxy: {
            // Proxy Fineract API to avoid CORS + SSL certificate issues in dev
            "/fineract-provider": {
                target: "https://localhost:8443",
                changeOrigin: true,
                secure: false, // accept self-signed cert
            },
        },
    },
});
