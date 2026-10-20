import { getVideo } from "@/lib/lessons";

function zipIndexForLesson(number: number) {
  return Math.max(0, number - 1);
}

export async function sourceUrlForLesson(lessonId: string): Promise<string | null> {
  const video = await getVideo(lessonId);
  if (video?.sourceUrl) return video.sourceUrl;
  return null;
}

export function sourceFilename(lessonId: string) {
  const n = Number(lessonId);
  return `lesson-${String(n).padStart(2, "0")}-source.zip`;
}

export { zipIndexForLesson };
