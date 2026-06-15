import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TechIcon } from "@/cv/TechIcon";

describe("TechIcon", () => {
  it("renders an aria-hidden span containing SVG when the alias is mapped", () => {
    const { container } = render(<TechIcon alias="React.js" size={18} />);
    const span = container.querySelector('span[aria-hidden="true"]');
    expect(span).not.toBeNull();
    expect(span?.innerHTML).toContain("<svg");
  });

  it("renders nothing when the alias has no icon mapping", () => {
    const { container } = render(
      <TechIcon alias="Pinterest Gestalt" size={18} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an alias not present in any mapping", () => {
    const { container } = render(
      <TechIcon alias="__unknown_alias__" size={18} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("applies the size prop as inline width and height in pixels", () => {
    const { container } = render(<TechIcon alias="React.js" size={20} />);
    const span = container.querySelector(
      'span[aria-hidden="true"]',
    ) as HTMLElement | null;
    expect(span).not.toBeNull();
    expect(span?.style.width).toBe("20px");
    expect(span?.style.height).toBe("20px");
  });
});
