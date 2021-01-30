module.exports = {
  extends: ["@socialgouv/eslint-config-react"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    "react/prop-types": "off",
    "simple-import-sort/sort": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
