"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Plan } from "@/lib/plans";
import type { PublicMember } from "@/lib/session-client";
import MemberShell from "@/components/members/member-shell";

type MemberRow = {
  id: string;
  email: string;
  plan: Plan;
  createdAt: string;
  blocked: boolean;
  blockedReason: string | null;
};

type LessonRow = {
  id: string;
  number: number;
  title: string;
  phase: number;
  phaseTitle: string;
  url: string;
  sourceUrl: string;
  proOnly: boolean;
};

type OrderRow = {
  orderId: string;
  email: string;
  plan: string;
  amountUsd: number;
  status: string;
  invoiceUrl: string | null;
  payCurrency: string | null;
  createdAt: string;
  paidAt: string | null;
};

type Tab = "members" | "courses" | "payments";
type CourseFilter = "all" | "missing-video" | "missing-source" | "pro" | "invalid";

function mediaKind(url: string) {
  const value = url.trim();
  if (!value) return "missing";
  if (!/^https?:\/\//i.test(value)) return "invalid";
  if (/drive\.google|docs\.google/i.test(value)) return "drive";
  if (/\.(mp4|webm|m4v|mov)(\?|$)/i.test(value)) return "file";
  return "link";
}

function kindLabel(url: string) {
  switch (mediaKind(url)) {
    case "missing":
      return "Missing";
    case "invalid":
      return "Invalid";
    case "drive":
      return "Drive";
    case "file":
      return "File";
    default:
      return "Link";
  }
}

export default function AdminDashboard({ member }: { member: PublicMember | null }) {
  const [tab, setTab] = useState<Tab>("courses");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, { url: string; sourceUrl: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  async function load() {
    const [membersRes, videosRes, ordersRes] = await Promise.all([
      fetch("/api/admin/members"),
      fetch("/api/admin/videos"),
      fetch("/api/admin/orders"),
    ]);
    const membersData = (await membersRes.json()) as { members?: MemberRow[]; error?: string };
    const videosData = (await videosRes.json()) as { lessons?: LessonRow[]; error?: string };
    const ordersData = (await ordersRes.json()) as { orders?: OrderRow[]; error?: string };
    if (!membersRes.ok) throw new Error(membersData.error || "Could not load members.");
    if (!videosRes.ok) throw new Error(videosData.error || "Could not load courses.");
    if (!ordersRes.ok) throw new Error(ordersData.error || "Could not load payments.");
    setMembers(membersData.members ?? []);
    const nextLessons = videosData.lessons ?? [];
    setLessons(nextLessons);
    setDrafts(Object.fromEntries(nextLessons.map((lesson) => [lesson.id, { url: lesson.url, sourceUrl: lesson.sourceUrl }])));
    setOrders(ordersData.orders ?? []);
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load admin."));
  }, []);

  const stats = useMemo(() => {
    const missingVideo = lessons.filter((lesson) => mediaKind(lesson.url) === "missing" || mediaKind(lesson.url) === "invalid");
    const missingSource = lessons.filter((lesson) => !lesson.sourceUrl.trim());
    const vip = members.filter((row) => row.plan === "basic" || row.plan === "pro" || row.plan === "admin");
    const paid = orders.filter((row) => /finished|confirmed|sending/i.test(row.status));
    return {
      members: members.length,
      vip: vip.length,
      missingVideo: missingVideo.length,
      missingSource: missingSource.length,
      orders: orders.length,
      paid: paid.length,
    };
  }, [lessons, members, orders]);

  const visibleMembers = members.filter((row) => row.email.toLowerCase().includes(memberQuery.trim().toLowerCase()));
  const visibleLessons = lessons.filter((lesson) => {
    const draft = drafts[lesson.id] ?? { url: lesson.url, sourceUrl: lesson.sourceUrl };
    const haystack = `${lesson.id} ${lesson.title} ${lesson.phaseTitle}`.toLowerCase();
    if (courseQuery.trim() && !haystack.includes(courseQuery.trim().toLowerCase())) return false;
    if (courseFilter === "missing-video") return mediaKind(draft.url) === "missing" || mediaKind(draft.url) === "invalid";
    if (courseFilter === "missing-source") return !draft.sourceUrl.trim();
    if (courseFilter === "pro") return lesson.proOnly;
    if (courseFilter === "invalid") return mediaKind(draft.url) === "invalid" || mediaKind(draft.sourceUrl) === "invalid";
    return true;
  });

  async function patchMember(email: string, body: { plan?: Plan; blocked?: boolean; password?: string }) {
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...body }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Member update failed.");
      return;
    }
    await load();
    if (body.password) setNotice(`Password updated for ${email}.`);
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        plan: String(form.get("plan") ?? "free"),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not save member.");
      return;
    }
    event.currentTarget.reset();
    await load();
    setNotice("Member saved.");
  }

  async function saveLesson(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(id);
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: id, url: draft.url, sourceUrl: draft.sourceUrl }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(null);
    if (!res.ok) {
      setError(data.error || "Could not save lesson.");
      return;
    }
    setLessons((current) => current.map((lesson) => (
      lesson.id === id ? { ...lesson, url: draft.url, sourceUrl: draft.sourceUrl } : lesson
    )));
    setNotice(`Lesson ${id} saved.`);
  }

  async function resetPassword(email: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setResetting(email);
    await patchMember(email, { password });
    setResetting(null);
    event.currentTarget.reset();
  }

  return (
    <MemberShell member={member}>
      <main className="admin-wrap">
        <div className="admin-hero">
          <div>
            <p className="eyebrow">ADMIN</p>
            <h1>Course operations</h1>
            <p className="auth-lead">Manage members, lesson videos, Pro source zips, and NOWPayments history on the original Atlas collections.</p>
          </div>
        </div>

        <section className="admin-stats">
          <article><span>Members</span><strong>{stats.members}</strong><em>{stats.vip} VIP</em></article>
          <article><span>Videos</span><strong>{lessons.length - stats.missingVideo}/{lessons.length || 50}</strong><em>{stats.missingVideo} need a URL</em></article>
          <article><span>Sources</span><strong>{lessons.length - stats.missingSource}/{lessons.length || 50}</strong><em>{stats.missingSource} without zip</em></article>
          <article><span>Payments</span><strong>{stats.paid}</strong><em>{stats.orders} invoices</em></article>
        </section>

        <nav className="admin-tabs" aria-label="Admin sections">
          {([["courses", "Courses"], ["members", "Members"], ["payments", "Payments"]] as const).map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {error ? <p className="form-error">{error}</p> : null}
        {notice ? <p className="admin-ok">{notice}</p> : null}

        {tab === "members" ? (
          <section className="admin-panel">
            <form className="admin-create" onSubmit={createMember}>
              <div>
                <label htmlFor="new-email">New member</label>
                <input id="new-email" name="email" type="email" placeholder="email@domain.com" required />
              </div>
              <div>
                <label htmlFor="new-password">Password</label>
                <input id="new-password" name="password" type="password" minLength={8} placeholder="8+ characters" required />
              </div>
              <div>
                <label htmlFor="new-plan">Plan</label>
                <select id="new-plan" name="plan" defaultValue="basic">
                  <option value="free">free</option>
                  <option value="basic">basic</option>
                  <option value="pro">pro</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <button className="button button-small" type="submit">Save member</button>
            </form>
            <div className="admin-toolbar">
              <input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Search email" />
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Created</th>
                    <th>Access</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMembers.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.email}</strong>
                        {row.blocked ? <span className="admin-pill bad">Blocked</span> : null}
                      </td>
                      <td>
                        <select value={row.plan} onChange={(event) => void patchMember(row.email, { plan: event.target.value as Plan })}>
                          <option value="free">free</option>
                          <option value="basic">basic</option>
                          <option value="pro">pro</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td>
                        {row.blocked ? (
                          <button className="button button-small" type="button" onClick={() => void patchMember(row.email, { blocked: false })}>Unblock</button>
                        ) : (
                          <button className="button button-outline button-small" type="button" onClick={() => void patchMember(row.email, { blocked: true })}>Block</button>
                        )}
                      </td>
                      <td>
                        <form className="admin-inline" onSubmit={(event) => void resetPassword(row.email, event)}>
                          <input name="password" type="password" minLength={8} placeholder="Reset password" />
                          <button className="button button-outline button-small" type="submit" disabled={resetting === row.email}>
                            {resetting === row.email ? "Saving" : "Update"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "courses" ? (
          <section className="admin-panel">
            <div className="admin-toolbar">
              <input value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} placeholder="Search lesson title or number" />
              <div className="admin-filters">
                {([["all", "All"], ["missing-video", "Missing video"], ["missing-source", "Missing source"], ["pro", "Pro only"], ["invalid", "Invalid URL"]] as const).map(([id, label]) => (
                  <button key={id} type="button" className={courseFilter === id ? "active" : ""} onClick={() => setCourseFilter(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="course-grid">
              {visibleLessons.map((lesson) => {
                const draft = drafts[lesson.id] ?? { url: lesson.url, sourceUrl: lesson.sourceUrl };
                const dirty = draft.url !== lesson.url || draft.sourceUrl !== lesson.sourceUrl;
                return (
                  <article key={lesson.id} className="course-card">
                    <header>
                      <div>
                        <strong>{lesson.id} · {lesson.title}</strong>
                        <span>{lesson.phaseTitle}</span>
                      </div>
                      <div className="admin-pills">
                        {lesson.proOnly ? <span className="admin-pill">PRO</span> : null}
                        <span className={`admin-pill ${mediaKind(draft.url)}`}>{kindLabel(draft.url)}</span>
                        <span className={`admin-pill ${draft.sourceUrl.trim() ? "drive" : "missing"}`}>{draft.sourceUrl.trim() ? "Source" : "No zip"}</span>
                      </div>
                    </header>
                    <label>Video URL</label>
                    <input
                      value={draft.url}
                      onChange={(event) => setDrafts((current) => ({ ...current, [lesson.id]: { ...draft, url: event.target.value } }))}
                      placeholder="Drive, mp4, or https link"
                    />
                    <label>Source zip URL</label>
                    <input
                      value={draft.sourceUrl}
                      onChange={(event) => setDrafts((current) => ({ ...current, [lesson.id]: { ...draft, sourceUrl: event.target.value } }))}
                      placeholder="https://drive.google.com/uc?export=download&id=…"
                    />
                    <div className="course-card-actions">
                      <button className="button button-small" type="button" disabled={!dirty || saving === lesson.id} onClick={() => void saveLesson(lesson.id)}>
                        {saving === lesson.id ? "Saving…" : dirty ? "Save changes" : "Saved"}
                      </button>
                      {draft.sourceUrl.trim() ? (
                        <a className="text-link" href={draft.sourceUrl} target="_blank" rel="noopener noreferrer">Open source</a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "payments" ? (
          <section className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6}>No NOWPayments invoices yet.</td></tr>
                  ) : orders.map((row) => (
                    <tr key={row.orderId}>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>
                      <td>{row.email}</td>
                      <td>{row.plan}</td>
                      <td>${row.amountUsd}{row.payCurrency ? ` · ${row.payCurrency}` : ""}</td>
                      <td><span className={`admin-pill ${/finished|confirmed|sending/i.test(row.status) ? "drive" : "missing"}`}>{row.status || "waiting"}</span></td>
                      <td>{row.invoiceUrl ? <a className="text-link" href={row.invoiceUrl} target="_blank" rel="noopener noreferrer">Open</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    </MemberShell>
  );
}
