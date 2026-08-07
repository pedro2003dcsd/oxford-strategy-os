import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig. Sin esto, los imports "@/lib/..." no
    // resuelven fuera de Next.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Solo lógica pura. Los componentes y las Server Actions necesitan
    // Supabase y un DOM: eso se sigue verificando a mano en el preview.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
