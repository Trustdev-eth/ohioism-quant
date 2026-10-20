const DOWNLOADER_UA =
  /idm|internet download manager|fdm|freedownloadmanager|jdownloader|aria2|wget|curl\/|libwww-perl|python-requests|go-http-client|okhttp|flashget|thunder|downloadaccelerator|getright|orbit|fiddler|httpdownloader/i;

export function isDownloaderUserAgent(ua: string | null | undefined) {
  return Boolean(ua && DOWNLOADER_UA.test(ua));
}

export function isBrowserVideoFetch(request: Request) {
  const dest = request.headers.get("sec-fetch-dest")?.toLowerCase() ?? "";
  if (dest === "video" || dest === "audio") return true;
  const ua = request.headers.get("user-agent") ?? "";
  const chromeLike = /Mozilla\/5\.0/i.test(ua) && /Chrome|Safari|Firefox|Edg/i.test(ua);
  return dest === "" && chromeLike && request.headers.has("range");
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
