import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => (
  <MantineProvider>
    <ModalsProvider>{children}</ModalsProvider>
  </MantineProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";
