import { NextResponse } from "next/server";
import { getSession, PLAY_COOKIE, PLAY_TOKEN_COOKIE, playCookieOptions, signPlayGrant } from "@/lib/auth";
import { canDownloadSource, canWatchLesson, getLesson, getVideo, isProOnlyLesson } from "@/lib/lessons";
import { classifyPlayback } from "@/lib/playback";
import { PLAN_PRICES_USD } from "@/lib/plans";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const member = await getSession();
  if (!member) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (member.blocked) return NextResponse.json({ error: "blocked" }, { status: 403 });

  const { id } = await context.params;
  const lesson = getLesson(id);
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const locked = !canWatchLesson(member.plan, lesson.number);
  if (locked) {
    return NextResponse.json({
      lesson: { id: lesson.id, number: lesson.number, title: lesson.title, phase: lesson.phase, phaseTitle: lesson.phaseTitle },
      locked: true,
      proOnly: isProOnlyLesson(lesson.number),
      upgradePrice: PLAN_PRICES_USD.upgrade,
      playback: { kind: "locked" },
      sourceAvailable: false,
    });
  }

  const video = await getVideo(lesson.id);
  const playback = classifyPlayback(video?.url);
  const sourceAvailable = Boolean(video?.sourceUrl) && canDownloadSource(member.plan);

  const res = NextResponse.json({
    lesson: { id: lesson.id, number: lesson.number, title: lesson.title, phase: lesson.phase, phaseTitle: lesson.phaseTitle },
    locked: false,
    proOnly: isProOnlyLesson(lesson.number),
    playback:
      playback.kind === "media"
        ? { kind: "media", mediaPath: `/api/media/${lesson.id}` }
        : playback,
    sourceAvailable,
  });

  if (playback.kind === "media") {
    const grant = await signPlayGrant(lesson.id);
    res.cookies.set(PLAY_COOKIE, lesson.id, playCookieOptions());
    res.cookies.set(PLAY_TOKEN_COOKIE, grant, playCookieOptions());
  }

  return res;
}
