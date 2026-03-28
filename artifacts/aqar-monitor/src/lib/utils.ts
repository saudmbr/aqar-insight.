import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0 ر.س";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value) + " ر.س";
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Convert a stored image path to a displayable URL.
 * Paths beginning with /objects/ are served via the storage proxy at /api/storage/objects/...
 * External http(s) URLs and null/empty values are returned as-is.
 */
export function getImageSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/objects/")) return `/api/storage${trimmed}`;
  return trimmed;
}
