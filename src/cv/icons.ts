import { TECH_ICON_SVGS } from "./tech-icon-svgs";

// Maps exact alias strings (Skill.aliases[] / WorkExperience.technologies[])
// to keys in TECH_ICON_SVGS.
//
// When adding a new technology to data.ts:
//   1. If an icon exists in tech-stack-icons → add the alias here, add the key
//      to REQUESTED_ICONS in scripts/cv/extract-tech-icons.ts, run:
//      pnpm extract-tech-icons
//   2. If no icon exists → add the alias to UNMAPPED_ALIASES below instead.
export const ALIAS_TO_ICON: Partial<Record<string, string>> = {
  ".NET Framework": "net",
  Android: "android",
  "Angular 2": "angular",
  "Angular.js": "angular",
  "Apollo GraphQL": "graphql",
  AWS: "aws",
  Cassandra: "cassandradb",
  "Claude Code": "claude",
  CSS: "css3",
  CSS3: "css3",
  Cursor: "cursor",
  Cypress: "cypress",
  Docker: "docker",
  Figma: "figma",
  Git: "git",
  "GitHub Actions": "github",
  "GitHub Copilot": "copilotgithub",
  "Gitlab CI": "gitlab",
  "Google Analytics": "analytics",
  "Google Cloud Platform": "gcloud",
  GraphQL: "graphql",
  HTML: "html5",
  HTML5: "html5",
  Java: "java",
  JavaScript: "js",
  Kubernetes: "kubernetes",
  MongoDB: "mongodb",
  MySQL: "mysql",
  "Next.js": "nextjs",
  "Node.js": "nodejs",
  "Oracle Database": "oracle",
  "Oracle SQL": "oracle",
  PHP: "php",
  pnpm: "pnpm",
  PostgreSQL: "postgresql",
  Python: "python",
  RabbitMQ: "rabbitmq",
  "React MUI": "materialui",
  "React Native": "reactnative",
  "React.js": "react",
  Redis: "redis",
  Redux: "redux",
  "Ruby on Rails": "rails",
  Sanity: "sanity",
  "Sanity.io": "sanity",
  Scala: "scala",
  SVN: "subversion",
  Tailwind: "tailwindcss",
  "Tailwind.css": "tailwindcss",
  TanStack: "tanstack",
  Turborepo: "turborepo",
  TypeScript: "typescript",
  Vite: "vitejs",
  "Vue.js": "vuejs",
  Webpack: "webpack",
};

// Technologies with no available icon in tech-stack-icons.
// Aliases here render text-only — no broken placeholder, no layout shift.
// When adding a technology that has no icon, add it here instead of ALIAS_TO_ICON.
export const UNMAPPED_ALIASES = new Set([
  "Buildkite",
  "Codeship",
  "GeneXus",
  "open source software",
  "Pinterest Gestalt",
  "SQL Server",
  "Vercel",
  "Webdriver.io",
]);

export function getTechIconSvg(alias: string): string | null {
  const key = ALIAS_TO_ICON[alias];
  if (!key) return null;
  return TECH_ICON_SVGS[key] ?? null;
}
