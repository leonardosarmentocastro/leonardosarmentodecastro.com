/**
 * Extracts SVG strings for the icons listed in REQUESTED_ICONS from the
 * tech-stack-icons devDependency and writes them to src/cv/tech-icon-svgs.ts.
 *
 * Run with:  pnpm extract-tech-icons
 *
 * When to re-run:
 *   - You added a key to REQUESTED_ICONS below (new technology with an icon).
 *   - You want to pull in SVG updates after bumping tech-stack-icons version.
 *
 * You do NOT need to re-run when:
 *   - You added an alias to UNMAPPED_ALIASES in src/cv/icons.ts (no icon exists).
 *   - You only changed alias strings in ALIAS_TO_ICON without adding new keys.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Add new keys here when a technology has a matching icon in tech-stack-icons.
// Browse available icon names at https://tech-stack-icons.com or search IconName
// in TypeScript after installing the devDep.
const REQUESTED_ICONS = [
  "analytics",
  "android",
  "angular",
  "aws",
  "cassandradb",
  "claude",
  "copilotgithub",
  "css3",
  "cursor",
  "cypress",
  "docker",
  "figma",
  "gcloud",
  "git",
  "github",
  "gitlab",
  "graphql",
  "html5",
  "java",
  "js",
  "kubernetes",
  "materialui",
  "mongodb",
  "mysql",
  "net",
  "nextjs",
  "nodejs",
  "oracle",
  "php",
  "payload",
  "pnpm",
  "postgresql",
  "python",
  "rabbitmq",
  "rails",
  "react",
  "reactnative",
  "redis",
  "redux",
  "sanity",
  "scala",
  "subversion",
  "tailwindcss",
  "turborepo",
  "typescript",
  "vitejs",
  "vuejs",
  "webpack",
] as const;

/**
 * Extracts the "light" variant SVG string for a given icon key from the
 * tech-stack-icons bundle. Keys are either unquoted JS identifiers (react)
 * or double-quoted strings for names with special chars ("c#", "c++").
 * Every SVG ends with </svg>, which is used as the reliable end marker.
 *
 * Patterns are anchored with a leading ',' or '{' to prevent matching a key
 * as a suffix of a longer icon name (e.g. "js" must not match "alpinejs",
 * "react" must not match "preact", "php" must not match "cakephp").
 */
function extractSvg(content: string, iconKey: string): string | null {
  const patterns = [
    `,"${iconKey}":{svg:{light:'`,
    `{"${iconKey}":{svg:{light:'`,
    `,${iconKey}:{svg:{light:'`,
    `{${iconKey}:{svg:{light:'`,
  ];

  for (const pattern of patterns) {
    const pos = content.indexOf(pattern);
    if (pos === -1) continue;

    const svgStart = pos + pattern.length;
    const rest = content.slice(svgStart);
    const endMarker = "</svg>'";
    const endIdx = rest.indexOf(endMarker);
    if (endIdx === -1) continue;

    return rest.slice(0, endIdx + "</svg>".length);
  }

  return null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const pkgPath = resolve(ROOT, "node_modules/tech-stack-icons/dist/index.js");
const outPath = resolve(ROOT, "src/cv/tech-icon-svgs.ts");

const content = readFileSync(pkgPath, "utf-8");
const extracted: Record<string, string> = {};
const missing: string[] = [];

for (const key of REQUESTED_ICONS) {
  const svg = extractSvg(content, key);
  if (svg) {
    extracted[key] = svg;
  } else {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.warn(
    "\nWarning: the following keys were not found in tech-stack-icons:",
  );
  for (const key of missing) console.warn(`  - ${key}`);
}

const entries = Object.entries(extracted)
  .map(([key, svg]) => `  ${key}: ${JSON.stringify(svg)}`)
  .join(",\n");

const output = `// AUTO-GENERATED — do not edit by hand.
// Source: tech-stack-icons (devDependency, light variant)
// To regenerate: pnpm extract-tech-icons
// To add an icon: add the key to REQUESTED_ICONS in scripts/cv/extract-tech-icons.ts,
//                 add the alias mapping in src/cv/icons.ts,
//                 then run pnpm extract-tech-icons.
export const TECH_ICON_SVGS: Record<string, string> = {
${entries},
};
`;

writeFileSync(outPath, output, "utf-8");
console.log(
  `\nWrote ${Object.keys(extracted).length} icons to src/cv/tech-icon-svgs.ts`,
);
