import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate).getTime() < Date.now();
}
