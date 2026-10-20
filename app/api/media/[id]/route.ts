import { NextResponse } from "next/server";
import { getSession, readPlayGrant } from "@/lib/auth";
import { blockMember } from "@/lib/members";
import { canWatchLesson, getLesson, getVideo } from "@/lib/lessons";
import { isAdmin } from "@/lib/plans";
import { classifyPlayback } from "@/lib/playback";
import { emptyDownloadResponse, isBrowserVideoFetch, isDownloadAttempt } from "@/lib/security";

async function gate(request: Request, id: string, mode: "GET" | "HEAD") {
  const lesson = getLesson(id);
  if (!lesson) return emptyDownloadResponse();

  const member = await getSession();
  if (!member || member.blocked) return emptyDownloadResponse();
  if (!canWatchLesson(member.plan, lesson.number)) return emptyDownloadResponse();

  if (!isAdmin(member.plan) && isDownloadAttempt(request)) {
    if (mode === "HEAD") return emptyDownloadResponse();
    await blockMember(member.email, "downloader");
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  if (mode === "GET" && !isBrowserVideoFetch(request) && !isAdmin(member.plan)) {
    await blockMember(member.email, "downloader");
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  const granted = await readPlayGrant();
  if (granted !== lesson.id && !isAdmin(member.plan)) {
    return emptyDownloadResponse();
  }

  const video = await getVideo(lesson.id);
  const playback = classifyPlayback(video?.url);
  if (playback.kind !== "media" || !playback.sourceUrl) return emptyDownloadResponse();
  return { lesson, playback, member };
}

export async function HEAD(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gated = await gate(request, id, "HEAD");
  if (gated instanceof Response) return gated;
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-store, private",
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gated = await gate(request, id, "GET");
  if (gated instanceof Response) return gated;

  const range = request.headers.get("range") ?? undefined;
  const upstream = await fetch(gated.playback.sourceUrl!, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return emptyDownloadResponse();
  }

  const headers = new Headers();
  const pass = ["content-type", "content-length", "content-range", "accept-ranges"];
  for (const key of pass) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("content-type")) headers.set("Content-Type", "video/mp4");
  headers.set("Cache-Control", "no-store, private");
  headers.set("Content-Disposition", "inline");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
