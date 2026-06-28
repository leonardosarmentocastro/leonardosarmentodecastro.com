// src/og/__tests__/avatar.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(Buffer.from("fake-image-bytes")),
  };
});

import { loadAvatarDataUri, mimeForAvatar } from "../avatar";

describe("mimeForAvatar", () => {
  it("maps .png to image/png", () => {
    expect(mimeForAvatar("/a/b.png")).toBe("image/png");
  });

  it("maps .webp to image/webp", () => {
    expect(mimeForAvatar("/a/b.webp")).toBe("image/webp");
  });

  it("falls back to image/jpeg for .jpg/.jpeg/unknown", () => {
    expect(mimeForAvatar("/a/b.jpg")).toBe("image/jpeg");
    expect(mimeForAvatar("/a/b.jpeg")).toBe("image/jpeg");
    expect(mimeForAvatar("/a/b")).toBe("image/jpeg");
  });
});

describe("loadAvatarDataUri", () => {
  it("returns a base64 image data URI", async () => {
    const uri = await loadAvatarDataUri();
    expect(uri).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
    expect(uri.length).toBeGreaterThan("data:image/jpeg;base64,".length);
  });
});
