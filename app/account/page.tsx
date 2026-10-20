"use client";

import { useEffect, useState } from "react";
import "../members.css";
import MemberShell from "@/components/members/member-shell";
import { ASSIST_TELEGRAM, PLAN_PRICES_USD } from "@/lib/plans";
import { fetchMe, type PublicMember } from "@/lib/session-client";

export default function AccountPage() {
  const [member, setMember] = useState<PublicMember | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<"basic" | "pro" | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid")) setNote("Payment submitted. Access unlocks when NOWPayments confirms the invoice.");
    if (params.get("canceled")) setNote("Checkout was canceled. You can try again anytime.");
    fetchMe().then((data) => {
      if (data.blocked) {
        window.location.href = "/blocked";
        return;
      }
      setMember(data.member);
    }).catch(() => setError("Could not load account."));
  }, []);

  async function pay(plan: "basic" | "pro") {
    setError("");
    setPaying(plan);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { invoiceUrl?: string; error?: string };
    if (!res.ok || !data.invoiceUrl) {
      setError(data.error || "Checkout failed.");
      setPaying(null);
      return;
    }
    window.location.href = data.invoiceUrl;
  }

  return (
    <MemberShell member={member}>
      <main className="member-main">
        <h1>Account</h1>
        {member ? (
          <>
            <p>{member.email}</p>
            <div className="plan-badge">{member.plan.toUpperCase()}</div>
            {note ? <p>{note}</p> : null}
            {member.vip ? (
              <p>Your VIP access is active. Open the course to watch lessons{member.plan === "pro" || member.plan === "admin" ? " and download Pro source zips" : ""}.</p>
            ) : (
              <p>This account is free until NOWPayments confirms a Basic or Pro invoice.</p>
            )}
            <div className="account-actions">
              {member.vip ? <a className="button" href="/learn">Open course</a> : null}
              {member.plan === "free" ? (
                <>
                  <button className="button" type="button" disabled={paying !== null} onClick={() => void pay("basic")}>{paying === "basic" ? "Opening…" : `Unlock Basic · $${PLAN_PRICES_USD.basic}`}</button>
                  <button className="button button-outline" type="button" disabled={paying !== null} onClick={() => void pay("pro")}>{paying === "pro" ? "Opening…" : `Unlock Pro · $${PLAN_PRICES_USD.pro}`}</button>
                </>
              ) : null}
              {member.plan === "basic" ? (
                <button className="button" type="button" disabled={paying !== null} onClick={() => void pay("pro")}>{paying === "pro" ? "Opening…" : `Upgrade to Pro · $${PLAN_PRICES_USD.upgrade}`}</button>
              ) : null}
              <a className="button button-outline" href={ASSIST_TELEGRAM} target="_blank" rel="noopener noreferrer">Assist ${PLAN_PRICES_USD.assistHour}/hr</a>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </>
        ) : (
          <p>Sign in to manage your plan. <a className="text-link" href="/login">Sign in</a></p>
        )}
      </main>
    </MemberShell>
  );
}
