const { defineConfig, globalIgnores } = require("eslint/config");

const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    extends: compat.extends("./packages/config/eslint/base.js"),
  },
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/build/",
    "**/venv/",
    "**/.venv/",
    "**/.wwebjs_auth/",
    "**/.wwebjs_cache/",
    "**/.cache/",
    "**/*.config.js",
    "**/.eslintrc.js",
  ]),
  {
    files: ["**/*.js", "**/*.cjs"],

    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
