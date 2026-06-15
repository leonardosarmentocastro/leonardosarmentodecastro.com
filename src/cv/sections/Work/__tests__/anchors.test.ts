import { afterEach, describe, expect, it, vi } from "vitest";

import { RESUME } from "@/cv/data";

import { scrollToWorkEntry, workEntryAnchorId } from "../anchors";

describe("workEntryAnchorId", () => {
  it("is deterministic for the same entry", () => {
    const entry = RESUME.workExperience[0];
    expect(workEntryAnchorId(entry)).toBe(workEntryAnchorId(entry));
  });

  it("slugifies company + startDate, stripping accents and spaces", () => {
    const entry = {
      ...RESUME.workExperience[0],
      company: "Quero Educação",
      startDate: "Sep 2020",
    };
    expect(workEntryAnchorId(entry)).toBe("work-quero-educacao-sep-2020");
  });

  it("is unique across every current work entry", () => {
    const ids = RESUME.workExperience.map(workEntryAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("scrollToWorkEntry", () => {
  const entry = RESUME.workExperience[0];

  const mountTarget = () => {
    const el = document.createElement("div");
    el.id = workEntryAnchorId(entry);
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls the matching element into view", () => {
    const el = mountTarget();
    scrollToWorkEntry(entry);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("adds the cv-flash class when motion is allowed", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    scrollToWorkEntry(entry);
    expect(el.classList.contains("cv-flash")).toBe(true);
  });

  it("does NOT flash when reduced motion is preferred", () => {
    const el = mountTarget();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    scrollToWorkEntry(entry);
    expect(el.classList.contains("cv-flash")).toBe(false);
  });

  it("is a no-op when no matching element is mounted", () => {
    expect(() => scrollToWorkEntry(entry)).not.toThrow();
  });

  it("dispatches cv:open-work-entry with anchor id", () => {
    mountTarget();
    const received: string[] = [];
    const listener = (e: Event) => {
      received.push((e as CustomEvent<string>).detail);
    };
    document.addEventListener("cv:open-work-entry", listener);

    scrollToWorkEntry(entry);

    document.removeEventListener("cv:open-work-entry", listener);
    expect(received).toEqual([workEntryAnchorId(entry)]);
  });
});
