import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    envDir: "./environments",

    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      tailwindcss(),
    ],
    base: "./",
    server: {
      proxy: {
        "/service": {
          target: "https://wap.kbzpay.com",
          changeOrigin: true,
          secure: true,
        },
        "/baas": {
          target: "https://wap.kbzpay.com",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
