/// <reference types="vitest" />
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import { loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  // Production build'e yanlışlıkla localhost gömülmesin / URL'siz bundle çıkmasın:
  // API adresi build anında inline'lanır, sonradan değiştirilemez.
  if (mode === "production") {
    const apiUrl = env.VITE_API_URL
    if (!apiUrl) {
      throw new Error(
        "VITE_API_URL tanımlı değil. Production build için .env.production dosyası oluşturun " +
          "veya VITE_API_URL environment variable verin (bkz. .env.example)."
      )
    }
    if (/localhost|127\.0\.0\.1/.test(apiUrl)) {
      // Lokal doğrulama build'leri için hata değil, belirgin uyarı:
      // bu dist DEPLOY EDİLMEMELİ.
      console.warn(
        "\n⚠️  UYARI: VITE_API_URL localhost içeriyor (" + apiUrl + "). " +
          "Bu build yalnızca lokal doğrulama içindir — production'a DEPLOY ETMEYİN. " +
          "Gerçek build için .env.production veya VITE_API_URL env variable kullanın.\n"
      )
    }
  }

  return {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
  }
})
