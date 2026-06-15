import { describe, expect, it } from "vitest";

import { RESUME } from "@/cv/data";
import { ALIAS_TO_ICON, UNMAPPED_ALIASES } from "@/cv/icons";

const allAliases = [
  ...RESUME.skills.flatMap((s) => s.aliases),
  ...RESUME.workExperience.flatMap((e) => e.technologies),
];
const uniqueAliases = [...new Set(allAliases)];

describe("icon coverage", () => {
  it("every alias is either mapped to an icon or explicitly opted out", () => {
    const unmapped = uniqueAliases.filter(
      (a) => !(a in ALIAS_TO_ICON) && !UNMAPPED_ALIASES.has(a),
    );
    expect(unmapped).toEqual(
      [],
      // If this fails, add each listed alias to either:
      //   ALIAS_TO_ICON in src/cv/icons.ts  (icon exists in tech-stack-icons)
      //   UNMAPPED_ALIASES in src/cv/icons.ts  (no icon available)
      // Then run `pnpm extract-tech-icons` if you added a new key to ALIAS_TO_ICON.
    );
  });

  it("UNMAPPED_ALIASES contains no alias that already has an icon mapping", () => {
    const duplicates = [...UNMAPPED_ALIASES].filter((a) => a in ALIAS_TO_ICON);
    expect(duplicates).toEqual([]);
  });
});
