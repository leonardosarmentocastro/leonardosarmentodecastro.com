import { describe, expect, it } from "vitest";

import { GET } from "../route";

describe("GET /cv/ats", () => {
  it("returns a downloadable PDF attachment", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(".pdf");
    expect(res.headers.get("content-disposition")).toContain(
      'filename="Leonardo-Sarmento-de-Castro-Resume-ATS.pdf"',
    );
  }, 30000);

  it("returns real PDF bytes", async () => {
    const res = await GET();
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  }, 30000);
});
