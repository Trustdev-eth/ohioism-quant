export const PLANS = ["free", "basic", "pro", "admin"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_PRICES_USD = {
  basic: 499,
  pro: 999,
  upgrade: 499,
  assistHour: 49,
} as const;

export const ASSIST_TELEGRAM = "https://t.me/ohioism1";

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

export function isVip(plan: Plan | null | undefined): boolean {
  return plan === "basic" || plan === "pro" || plan === "admin";
}

export function isPro(plan: Plan | null | undefined): boolean {
  return plan === "pro" || plan === "admin";
}

export function isAdmin(plan: Plan | null | undefined): boolean {
  return plan === "admin";
}

export function planRank(plan: Plan): number {
  switch (plan) {
    case "free":
      return 0;
    case "basic":
      return 1;
    case "pro":
      return 2;
    case "admin":
      return 3;
  }
}

export function checkoutAmountUsd(current: Plan, target: "basic" | "pro"): number | null {
  if (target === "basic") {
    if (planRank(current) >= planRank("basic")) return null;
    return PLAN_PRICES_USD.basic;
  }
  if (current === "basic") return PLAN_PRICES_USD.upgrade;
  if (planRank(current) >= planRank("pro")) return null;
  return PLAN_PRICES_USD.pro;
}

export function publicMember(member: { email: string; plan: Plan; createdAt?: Date }) {
  return {
    email: member.email,
    plan: member.plan,
    vip: isVip(member.plan),
    createdAt: member.createdAt?.toISOString() ?? null,
  };
}
