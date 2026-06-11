import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  trackResumeClick: vi.fn(),
  trackLinkedinClick: vi.fn(),
  trackContactModalOpen: vi.fn(),
  trackContactModalDismiss: vi.fn(),
  trackWhatsappClick: vi.fn(),
  trackEmailClick: vi.fn(),
}));

import {
  trackContactModalDismiss,
  trackContactModalOpen,
  trackEmailClick,
  trackLinkedinClick,
  trackResumeClick,
  trackWhatsappClick,
} from "@/lib/analytics";
import { renderWithProviders, screen } from "@/test/render";

import { LandingPage } from "./LandingPage";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LandingPage analytics", () => {
  it("fires resume_clicked when the RESUME link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const link = screen.getByRole("link", { name: /resume/i });
    await user.click(link);

    expect(trackResumeClick).toHaveBeenCalledTimes(1);
  });
});
