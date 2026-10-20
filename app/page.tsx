import { redirect } from "next/navigation";
import HomeLanding from "@/components/landing/home-landing";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const member = await getSession();
  if (member?.blocked) redirect("/blocked");
  return <HomeLanding />;
}
