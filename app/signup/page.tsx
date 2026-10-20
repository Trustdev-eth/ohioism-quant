"use client";

import { FormEvent, useState } from "react";
import "../members.css";
import MemberShell from "@/components/members/member-shell";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not create account.");
      setPending(false);
      return;
    }
    window.location.href = "/account";
  }

  return (
    <MemberShell>
      <main className="member-main">
        <h1>Create account</h1>
        <p className="auth-lead">Free to create. Pay with NOWPayments to unlock Basic or Pro.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button" type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
        </form>
        <p className="auth-switch">Already a member? <a className="text-link" href="/login">Sign in</a></p>
      </main>
    </MemberShell>
  );
}
