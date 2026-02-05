import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Arrondi mathématique standard pour montants XAF
 * - ≥ 0.5 → supérieur (3.6 → 4)
 * - < 0.5 → inférieur (3.4 → 3)
 */
export function roundMoney(amount: number): number {
  return Math.round(amount);
}
