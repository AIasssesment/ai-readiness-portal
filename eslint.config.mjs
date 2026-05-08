import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "dist/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default config;