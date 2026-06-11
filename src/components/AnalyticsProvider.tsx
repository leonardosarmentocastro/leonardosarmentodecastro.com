"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { initAnalytics } from "@/lib/analytics";

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    initAnalytics();
  }, []);

  return <>{children}</>;
};
