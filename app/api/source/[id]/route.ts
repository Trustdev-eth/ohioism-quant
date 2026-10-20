import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canDownloadSource, getLesson } from "@/lib/lessons";
import { sourceFilename, sourceUrlForLesson } from "@/lib/source-pack";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const member = await getSession();
  if (!member) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (member.blocked) return NextResponse.json({ error: "blocked" }, { status: 403 });
  if (!canDownloadSource(member.plan)) {
    return NextResponse.json({ error: "Source downloads are included with Pro." }, { status: 403 });
  }

  const { id } = await context.params;
  const lesson = getLesson(id);
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const url = await sourceUrlForLesson(lesson.id);
  if (!url) return NextResponse.json({ error: "No source pack for this lesson." }, { status: 404 });

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Source pack unavailable." }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "application/zip");
  headers.set("Content-Disposition", `attachment; filename="${sourceFilename(lesson.id)}"`);
  headers.set("Cache-Control", "no-store, private");
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
