import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "src/generated/prisma/**",
    // Local agent/tooling workspaces and imported templates:
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    ".project/**",
    ".temp/**",
    ".vscode/**",
    ".windsurf/**",
    "artifacts/**",
    "tmp/**",
    "*.tsbuildinfo",
  ]),
]);

export default eslintConfig;
