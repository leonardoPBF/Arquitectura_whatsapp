module.exports = {
  root: true,
  extends: ["./packages/config/eslint/base.js"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "*.config.js",
    ".eslintrc.js",
  ],
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
