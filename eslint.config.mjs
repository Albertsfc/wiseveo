import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Editor-level feedback for hardcoded UI strings in JSX/TSX (severity "warn":
  // the hard gate is the AST scanner in scripts/check-hardcoded-strings.ts, run
  // via `npm run check:i18n:code` and wired into `npm run build`). This rule is
  // scoped to JSX markup only (mode: "jsx-only") so it flags literal strings and
  // key user-facing attribute values inside .tsx components, without policing
  // plain TS logic/config strings elsewhere in the same file.
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/components/ui/**"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "warn",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            include: ["placeholder", "title", "alt", "aria-label", "label"],
          },
        },
      ],
    },
  },
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
