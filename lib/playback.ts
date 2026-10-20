const DRIVE_FILE = /\/file\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_OPEN = /[?&]id=([a-zA-Z0-9_-]+)/;
const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;

export function driveFileId(url: string): string | null {
  return url.match(DRIVE_FILE)?.[1] ?? url.match(DRIVE_OPEN)?.[1] ?? null;
}

export function isGoogleDriveUrl(url: string) {
  return /https?:\/\/(?:drive|docs)\.google\.com\//i.test(url) && Boolean(driveFileId(url));
}

export function driveEmbedUrl(url: string) {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

export function youtubeId(url: string) {
  return url.match(YOUTUBE)?.[1] ?? null;
}

export function youtubeEmbedUrl(url: string) {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function vimeoId(url: string) {
  return url.match(VIMEO)?.[1] ?? null;
}

export function vimeoEmbedUrl(url: string) {
  const id = vimeoId(url);
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

export function isDirectMediaUrl(url: string) {
  return /\.(mp4|webm|m4v|mov)(\?|$)/i.test(url) || /r2\.dev|cloudflarestorage|x-id=GetObject/i.test(url);
}

export type PlaybackKind = "drive" | "iframe" | "media" | "missing";

export function classifyPlayback(url: string | null | undefined): {
  kind: PlaybackKind;
  embedUrl?: string;
  sourceUrl?: string;
} {
  if (!url) return { kind: "missing" };
  if (isGoogleDriveUrl(url)) {
    const embedUrl = driveEmbedUrl(url);
    return embedUrl ? { kind: "drive", embedUrl } : { kind: "missing" };
  }
  const yt = youtubeEmbedUrl(url);
  if (yt) return { kind: "iframe", embedUrl: yt };
  const vimeo = vimeoEmbedUrl(url);
  if (vimeo) return { kind: "iframe", embedUrl: vimeo };
  if (isDirectMediaUrl(url) || /^https?:\/\//i.test(url)) {
    return { kind: "media", sourceUrl: url };
  }
  return { kind: "missing" };
}
