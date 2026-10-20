export type PublicMember = {
  email: string;
  plan: "free" | "basic" | "pro" | "admin";
  vip: boolean;
  createdAt: string | null;
};

export async function fetchMe(): Promise<{ member: PublicMember | null; blocked?: boolean }> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  return (await res.json()) as { member: PublicMember | null; blocked?: boolean };
}
