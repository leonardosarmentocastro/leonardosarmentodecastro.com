import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement window.matchMedia, which Mantine's MantineProvider
// and GSAP's gsap.matchMedia() both depend on. Polyfill once for all tests.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
