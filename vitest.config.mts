import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pin the timezone so date-based tests are deterministic on every machine/CI.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
