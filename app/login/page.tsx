"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import "../members.css";
import MemberShell from "@/components/members/member-shell";

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const data = (await res.json()) as { error?: string; blocked?: boolean; member?: { vip?: boolean; plan?: string } };
    if (data.blocked) {
      window.location.href = "/blocked";
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not sign in.");
      setPending(false);
      return;
    }
    const next = params.get("next");
    if (next && next.startsWith("/")) {
      window.location.href = next;
      return;
    }
    window.location.href = data.member?.plan === "admin" ? "/admin" : data.member?.vip ? "/learn" : "/account";
  }

  return (
    <MemberShell>
      <main className="member-main">
        <h1>Sign in</h1>
        <p className="auth-lead">Use the email on your OhioismQuant account.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-switch">Need an account? <a className="text-link" href="/signup">Create one</a></p>
      </main>
    </MemberShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
