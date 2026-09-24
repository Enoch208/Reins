import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import reins from "./eslint-rules/index.js";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "coverage/**",
      "apps/api/drizzle/**",
      "video/**",
      "design/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat["recommended-latest"],
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
    plugins: {
      reins,
    },
    rules: {
      "reins/no-comments": "error",
      "no-console": "error",
    },
  },
  {
    files: ["eslint.config.js", "eslint-rules/**/*.js", "**/*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
