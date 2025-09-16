import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getViewByPath(
  viewPaths: Record<string, string>,
  path?: string,
) {
  if (!path) return undefined;

  return Object.entries(viewPaths).find(([_, value]) => value === path)?.[0];
}
