import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
}));

import { initAnalytics } from "@/lib/analytics";
import { AnalyticsProvider } from "./AnalyticsProvider";

afterEach(() => {
  vi.clearAllMocks();
});

describe("AnalyticsProvider", () => {
  it("calls initAnalytics on mount", () => {
    render(
      <AnalyticsProvider>
        <span>child</span>
      </AnalyticsProvider>,
    );

    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });

  it("renders children", () => {
    render(
      <AnalyticsProvider>
        <span data-testid="probe">child</span>
      </AnalyticsProvider>,
    );

    expect(screen.getByTestId("probe")).toBeInTheDocument();
  });

  it("does not call initAnalytics more than once across re-renders", () => {
    const { rerender } = render(
      <AnalyticsProvider>
        <span>child</span>
      </AnalyticsProvider>,
    );

    rerender(
      <AnalyticsProvider>
        <span>child two</span>
      </AnalyticsProvider>,
    );

    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });
});
