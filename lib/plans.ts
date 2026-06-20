import type { Plan } from "./types";

export const plans: Record<Plan, { name: string; price: number; watchLimitMinutes: number | null; downloads: string }> = {
  free: { name: "Free", price: 0, watchLimitMinutes: 5, downloads: "1 per day" },
  bronze: { name: "Bronze", price: 10, watchLimitMinutes: 7, downloads: "Unlimited" },
  silver: { name: "Silver", price: 50, watchLimitMinutes: 10, downloads: "Unlimited" },
  gold: { name: "Gold", price: 100, watchLimitMinutes: null, downloads: "Unlimited" }
};

export const planOrder: Plan[] = ["free", "bronze", "silver", "gold"];
