import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export const soilHealthStatus = (
  value: number,
  type: "ph" | "n" | "p" | "k" | "moisture"
) => {
  const ranges = {
    ph: { low: 5.5, high: 7.5 },
    n: { low: 30, high: 60 },
    p: { low: 20, high: 40 },
    k: { low: 150, high: 250 },
    moisture: { low: 30, high: 70 },
  };

  const range = ranges[type];

  if (value < range.low) return "low";
  if (value > range.high) return "high";
  return "optimal";
};
