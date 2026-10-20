import { getDb } from "@/lib/mongo";
import { getLesson, isProOnlyLesson, lessons, type Lesson } from "@/lib/lesson-catalog";
import { isAdmin, isPro, isVip, type Plan } from "@/lib/plans";

export { getLesson, isProOnlyLesson, lessons, type Lesson };
export { PRO_ONLY_LESSONS } from "@/lib/lesson-catalog";

export function canWatchLesson(plan: Plan | null | undefined, number: number) {
  if (!isVip(plan)) return false;
  if (isProOnlyLesson(number)) return isPro(plan);
  return true;
}

export function canDownloadSource(plan: Plan | null | undefined) {
  return isPro(plan);
}

export type VideoDoc = {
  lessonId: string;
  url?: string;
  sourceUrl?: string;
};

function lessonKeys(lessonId: string) {
  const padded = lessonId.padStart(2, "0");
  return [padded, String(Number(padded)), Number(padded)] as const;
}

export async function getVideo(lessonId: string): Promise<VideoDoc | null> {
  const db = await getDb();
  const [padded, numeric, asNumber] = lessonKeys(lessonId);
  const doc = await db.collection("videos").findOne({
    $or: [{ lessonId: padded }, { lessonId: numeric }, { lessonId: asNumber }],
  });
  if (!doc) return null;
  return {
    lessonId: String(doc.lessonId),
    url: typeof doc.url === "string" ? doc.url : undefined,
    sourceUrl: typeof doc.sourceUrl === "string" ? doc.sourceUrl : undefined,
  };
}

export type CourseRow = Lesson & {
  url: string;
  sourceUrl: string;
  proOnly: boolean;
};

export async function listCourseRows(): Promise<CourseRow[]> {
  const db = await getDb();
  const rows = await db.collection("videos").find({}).toArray();
  const byId = new Map<string, VideoDoc>();
  for (const row of rows) {
    const id = String(row.lessonId).padStart(2, "0");
    byId.set(id, {
      lessonId: id,
      url: typeof row.url === "string" ? row.url : undefined,
      sourceUrl: typeof row.sourceUrl === "string" ? row.sourceUrl : undefined,
    });
  }
  return lessons.map((lesson) => {
    const video = byId.get(lesson.id);
    return {
      ...lesson,
      url: video?.url ?? "",
      sourceUrl: video?.sourceUrl ?? "",
      proOnly: isProOnlyLesson(lesson.number),
    };
  });
}

export async function saveVideo(lessonId: string, patch: { url?: string; sourceUrl?: string }) {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error("Lesson not found.");
  const db = await getDb();
  const [padded, numeric, asNumber] = lessonKeys(lesson.id);
  const existing = await db.collection("videos").findOne({
    $or: [{ lessonId: padded }, { lessonId: numeric }, { lessonId: asNumber }],
  });
  const url = patch.url !== undefined ? patch.url.trim() : String(existing?.url ?? "");
  const sourceUrl = patch.sourceUrl !== undefined ? patch.sourceUrl.trim() : String(existing?.sourceUrl ?? "");
  const next = { lessonId: padded, url, sourceUrl, updatedAt: new Date() };
  if (existing?._id) {
    await db.collection("videos").updateOne({ _id: existing._id }, { $set: next });
  } else {
    await db.collection("videos").insertOne(next);
  }
  return { ...lesson, url, sourceUrl, proOnly: isProOnlyLesson(lesson.number) };
}

export function sourceAllowed(plan: Plan | null | undefined) {
  return isAdmin(plan) || isPro(plan);
}
