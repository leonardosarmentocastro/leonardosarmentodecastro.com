import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /api/cv/json", () => {
  it("returns JSON Resume with a 200 and JSON content type", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("sends a permissive CORS header for the scraper", () => {
    const res = GET();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("serializes the mapped resume", async () => {
    const body = await GET().json();
    expect(body.basics.name).toBe("Leonardo Sarmento de Castro");
    expect(Array.isArray(body.work)).toBe(true);
    expect(body.work[0].keywords.length).toBeGreaterThan(0);
  });
});
