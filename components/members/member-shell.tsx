"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "@/components/landing/brand";
import type { PublicMember } from "@/lib/session-client";

export default function MemberShell({
  member,
  children,
}: {
  member?: PublicMember | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="member-app">
      <header className="member-top">
        <Brand />
        <nav className="member-nav">
          {member?.vip ? <Link href="/learn" className={pathname.startsWith("/learn") ? "active" : ""}>Course</Link> : null}
          <Link href="/account" className={pathname.startsWith("/account") ? "active" : ""}>Account</Link>
          {member?.plan === "admin" ? <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Admin</Link> : null}
          {member ? (
            <button type="button" className="member-logout" onClick={() => void logout()}>Sign out</button>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
