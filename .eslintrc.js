module.exports = {
  extends: ["@socialgouv/eslint-config-react", "plugin:storybook/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    "react/prop-types": "off",
    "simple-import-sort/sort": "off",
    "sort-keys-fix/sort-keys-fix": "off"
  },
  overrides: [{
    files: ["*.js", "*.ts", "*.tsx", "*.jsx"]
  }],
  settings: {
    react: {
      version: "detect"
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"]
      }
    }
  }
};