import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "paid-service",
          root: "apps/paid-service",
          include: ["tests/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "core",
          root: "packages/core",
          include: ["tests/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "api",
          root: "apps/api",
          include: ["tests/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          testTimeout: 30_000,
          env: {
            DATABASE_URL: "postgres://reins:reins@localhost:54320/reins_test",
          },
        },
      },
    ],
  },
});
