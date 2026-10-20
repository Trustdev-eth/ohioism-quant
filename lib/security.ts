const DOWNLOADER_UA =
  /\b(idm(?:ext|an)?|\bidm\b|idman|internet\s*download\s*manager|freedownloadmanager|\bfdm\b|jdownloader|flashget|getright|download\s*master|download\s*accelerator|aria2|wget|curl\/|yt-dlp|youtube-dl|libavformat|\blavf\b|python-requests|go-http-client|okhttp|libwww-perl|thunder|orbit|fiddler|httpdownloader|nsplayer|windows-media-player)\b/i;

export function userAgent(request: Request) {
  return request.headers.get("user-agent") ?? "";
}

export function fetchDest(request: Request) {
  return (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
}

export function isDownloaderUserAgent(ua: string | null | undefined) {
  return Boolean(ua && (DOWNLOADER_UA.test(ua) || /internet download manager/i.test(ua)));
}

export function isBrowserVideoFetch(request: Request) {
  const dest = fetchDest(request);
  return dest === "video" || dest === "audio";
}

export function isDownloadAttempt(request: Request) {
  if (isDownloaderUserAgent(userAgent(request))) return true;
  const dest = fetchDest(request);
  if (dest === "video" || dest === "audio") return false;
  return dest === "" || dest === "empty" || dest === "document" || dest === "download";
}

export function emptyDownloadResponse() {
  return new Response("", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
    },
  });
}
