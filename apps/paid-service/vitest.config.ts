import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "paid-service",
    root: import.meta.dirname,
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
