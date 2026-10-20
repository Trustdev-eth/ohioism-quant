"use client";

import { useEffect, useMemo, useState } from "react";
import "../members.css";
import MemberShell from "@/components/members/member-shell";
import { isProOnlyLesson, lessonLabel, lessons } from "@/lib/lesson-catalog";
import { PLAN_PRICES_USD } from "@/lib/plans";
import { fetchMe, type PublicMember } from "@/lib/session-client";

type Playback =
  | { kind: "drive" | "iframe"; embedUrl: string }
  | { kind: "media"; mediaPath: string }
  | { kind: "locked" | "missing" };

type LessonPayload = {
  lesson: { id: string; number: number; title: string; phase: number; phaseTitle: string };
  locked: boolean;
  proOnly: boolean;
  upgradePrice?: number;
  playback: Playback;
  sourceAvailable: boolean;
};

export default function LearnPage() {
  const [member, setMember] = useState<PublicMember | null>(null);
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "01");
  const [payload, setPayload] = useState<LessonPayload | null>(null);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const key = `${lesson.phase}:${lesson.phaseTitle}`;
      const list = map.get(key) ?? [];
      list.push(lesson);
      map.set(key, list);
    }
    return [...map.entries()];
  }, []);

  useEffect(() => {
    fetchMe().then((data) => {
      if (data.blocked) {
        window.location.href = "/blocked";
        return;
      }
      if (!data.member?.vip) {
        window.location.href = "/account";
        return;
      }
      setMember(data.member);
    }).catch(() => setError("Could not load session."));
  }, []);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    setPayload(null);
    fetch(`/api/lessons/${activeId}`)
      .then(async (res) => {
        const data = (await res.json()) as LessonPayload & { error?: string };
        if (!res.ok) throw new Error(data.error || "Could not load lesson.");
        if (!cancelled) setPayload(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load lesson.");
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, member]);

  async function upgrade() {
    setUpgrading(true);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    });
    const data = (await res.json()) as { invoiceUrl?: string; error?: string };
    if (data.invoiceUrl) window.location.href = data.invoiceUrl;
    else {
      setError(data.error || "Upgrade failed.");
      setUpgrading(false);
    }
  }

  return (
    <MemberShell member={member}>
      <div className="learn-shell">
        <aside className="learn-list">
          {grouped.map(([key, items]) => (
            <div key={key}>
              <div className="learn-phase">{items[0]?.phaseTitle}</div>
              {items.map((lesson) => {
                const proOnly = isProOnlyLesson(lesson.number);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`learn-item${activeId === lesson.id ? " active" : ""}`}
                    onClick={() => { setError(""); setActiveId(lesson.id); }}
                  >
                    <span>
                      <strong>{lessonLabel(lesson)}</strong>
                      {proOnly ? <span className="learn-lock">PRO</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
        <section className="learn-player">
          <div className="player-meta">
            <div>
              <h1>{payload?.lesson.title ?? "Loading…"}</h1>
              <p>{payload ? `${payload.lesson.phaseTitle} · Lesson ${payload.lesson.id}` : error || "Select a lesson."}</p>
            </div>
            {payload?.sourceAvailable ? (
              <a className="button button-small" href={`/api/source/${activeId}`}>Download source</a>
            ) : null}
          </div>
          <div className="player-frame">
            {payload?.locked ? (
              <div className="player-locked">
                <div>
                  <h2>Pro lesson</h2>
                  <p>Upgrade to Pro for ${payload.upgradePrice ?? PLAN_PRICES_USD.upgrade} to watch this lesson and download source zips.</p>
                  <button className="button" type="button" style={{ marginTop: 18 }} disabled={upgrading} onClick={() => void upgrade()}>
                    {upgrading ? "Opening invoice…" : `Upgrade · $${PLAN_PRICES_USD.upgrade}`}
                  </button>
                </div>
              </div>
            ) : payload?.playback.kind === "drive" || payload?.playback.kind === "iframe" ? (
              <iframe
                title={payload.lesson.title}
                src={payload.playback.embedUrl}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : payload?.playback.kind === "media" ? (
              <video
                controls
                playsInline
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(event) => event.preventDefault()}
                src={payload.playback.mediaPath}
                onError={() => {
                  fetch("/api/auth/me")
                    .then((res) => res.json())
                    .then((data: { blocked?: boolean }) => {
                      if (data.blocked) window.location.href = "/blocked";
                    })
                    .catch(() => undefined);
                }}
              />
            ) : (
              <div className="player-locked">
                <div>
                  <h2>{error || "Lesson media is not linked yet."}</h2>
                  <p>Videos come from the original `videos` collection (`lessonId`, `url`, `sourceUrl`).</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </MemberShell>
  );
}
