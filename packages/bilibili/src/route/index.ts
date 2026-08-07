export type BilibiliContextType =
  | "video"
  | "collection"
  | "favorite"
  | "user"
  | "search"
  | "unknown";

export interface BilibiliContext {
  type: BilibiliContextType;
  source: "auto";
  bvid?: string;
  page?: number;
  mid?: string;
  season_id?: string;
  media_id?: string;
  keyword?: string;
  order?: string;
  note?: string;
}

export interface BilibiliPageHints {
  bvid?: string;
  mid?: string;
  season_id?: string;
  media_id?: string;
  keyword?: string;
  fromVideoPath?: boolean;
}

export function extractBvid(text: string | null | undefined): string {
  if (!text) return "";
  const value = String(text).trim();
  if (!value) return "";
  if (/^BV[\w]+$/i.test(value)) return `BV${value.slice(2)}`;
  const match = value.match(/BV[\w]+/i);
  return match ? `BV${match[0].slice(2)}` : "";
}

export function routeVideoKey(
  bvid: string | null | undefined,
  page: number | string | null | undefined,
): string {
  return `${String(bvid || "").toUpperCase()}:P${Math.max(1, Number(page) || 1)}`;
}

/** DOM-free route detector. Callers may supply page-derived hints separately. */
export function detectContext(
  href: string,
  hints: BilibiliPageHints = {},
): BilibiliContext {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { type: "unknown", source: "auto" };
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (host === "search.bilibili.com") {
    if (/^\/(all|video)\/?$/i.test(path)) {
      const keyword = (url.searchParams.get("keyword") || "").trim() || hints.keyword;
      if (keyword) {
        const allowed = new Set(["totalrank", "click", "pubdate", "dm", "stow", "scores"]);
        const requestedOrder = (url.searchParams.get("order") || "totalrank")
          .trim()
          .toLowerCase();
        return {
          type: "search",
          source: "auto",
          keyword,
          order: allowed.has(requestedOrder) ? requestedOrder : "totalrank",
          page: Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1),
        };
      }
    }
    return { type: "unknown", source: "auto" };
  }

  if (host === "space.bilibili.com") {
    let match = path.match(/^\/(\d+)\/lists\/(\d+)\/?$/i);
    if (match?.[1] && match[2]) {
      return {
        type: "collection",
        source: "auto",
        mid: match[1],
        season_id: match[2],
      };
    }
    match = path.match(/^\/(\d+)\/channel\/(?:collection|series)detail\/?$/i);
    const seasonId =
      url.searchParams.get("sid") ||
      url.searchParams.get("season_id") ||
      hints.season_id;
    if (match?.[1] && seasonId && /^\d+$/.test(seasonId)) {
      return {
        type: "collection",
        source: "auto",
        mid: match[1],
        season_id: String(seasonId),
      };
    }
    const mediaId = (url.searchParams.get("fid") || hints.media_id || "").trim();
    if (mediaId && /^\d+$/.test(mediaId) && /\/favlist\/?$/i.test(path)) {
      return { type: "favorite", source: "auto", media_id: mediaId };
    }
    match = path.match(/^\/(\d+)/);
    if (match?.[1]) {
      return { type: "user", source: "auto", mid: match[1] };
    }
    return { type: "unknown", source: "auto" };
  }

  if (/^(www\.)?bilibili\.com$/i.test(host)) {
    let match = path.match(/^\/medialist\/(?:detail|play)\/ml(\d+)\/?$/i);
    if (match?.[1]) return { type: "favorite", source: "auto", media_id: match[1] };
    match = path.match(/^\/list\/ml(\d+)\/?/i);
    if (match?.[1]) return { type: "favorite", source: "auto", media_id: match[1] };

    match = path.match(/^\/list\/(\d+)\/?/i);
    if (match?.[1]) {
      const mid = match[1];
      const seasonId =
        url.searchParams.get("sid") ||
        url.searchParams.get("season_id") ||
        hints.season_id;
      const bvid =
        extractBvid(href) ||
        extractBvid(url.searchParams.get("bvid")) ||
        hints.bvid ||
        "";
      const page = Math.max(
        1,
        Number.parseInt(url.searchParams.get("p") || "1", 10) || 1,
      );
      if (seasonId && /^\d+$/.test(String(seasonId))) {
        return {
          type: "collection",
          source: "auto",
          mid,
          season_id: String(seasonId),
          ...(bvid ? { bvid } : {}),
          page,
        };
      }
      if (bvid) {
        return {
          type: "video",
          source: "auto",
          bvid,
          mid,
          page,
          note: "list_without_sid",
        };
      }
      return { type: "user", source: "auto", mid, note: "list_mid_only" };
    }

    const bvid = extractBvid(path) || extractBvid(href) || hints.bvid || "";
    if (bvid && (/\/video\//i.test(path) || hints.fromVideoPath)) {
      return {
        type: "video",
        source: "auto",
        bvid,
        page: Math.max(
          1,
          Number.parseInt(url.searchParams.get("p") || "1", 10) || 1,
        ),
      };
    }
  }

  if (hints.bvid) {
    return { type: "video", source: "auto", bvid: hints.bvid, page: 1 };
  }
  return { type: "unknown", source: "auto" };
}

