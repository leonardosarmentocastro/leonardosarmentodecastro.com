import { describe, expect, it } from "vitest";

import { parseLocation, toIsoMonth } from "../helpers";

describe("toIsoMonth", () => {
  it("converts 'Aug 2024' to '2024-08'", () => {
    expect(toIsoMonth("Aug 2024")).toBe("2024-08");
  });

  it("throws on unrecognized input", () => {
    expect(() => toIsoMonth("Present")).toThrow();
  });
});

describe("parseLocation", () => {
  it("splits city, region and country code, stripping the flag emoji", () => {
    expect(parseLocation("São José dos Campos, São Paulo — Brazil 🇧🇷")).toEqual(
      {
        city: "São José dos Campos",
        region: "São Paulo",
        countryCode: "BR",
      },
    );
  });
});
