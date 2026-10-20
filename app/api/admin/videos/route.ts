import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listCourseRows, saveVideo } from "@/lib/lessons";
import { isAdmin } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const lessons = await listCourseRows();
  return NextResponse.json({ lessons });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isAdmin(session.plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    lessonId?: string;
    url?: string;
    sourceUrl?: string;
  } | null;
  const lessonId = String(body?.lessonId ?? "").trim();
  if (!lessonId) return NextResponse.json({ error: "Lesson id required." }, { status: 400 });
  try {
    const lesson = await saveVideo(lessonId, {
      url: body?.url,
      sourceUrl: body?.sourceUrl,
    });
    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed." }, { status: 400 });
  }
}
