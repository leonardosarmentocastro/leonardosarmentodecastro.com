import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class strings; shadcn/ui primitives use this for variant overrides. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
