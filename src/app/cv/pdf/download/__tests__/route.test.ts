import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /cv/pdf/download", () => {
  it("returns the recruiter PDF as a downloadable attachment", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(
      'filename="Leonardo-Sarmento-de-Castro-Resume.pdf"',
    );
  });

  it("returns real PDF bytes", async () => {
    const res = await GET();
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
