export type BilibiliContextType =
  | "video"
  | "collection"
  | "favorite"
  | "user"
  | "search"
  | "unknown";

export interface BilibiliContext {
  type: BilibiliContextType;
  source: "auto" | "manual";
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

/** Preserve v6 extractBvid quirks (case-insensitive BV match can yield `BVid` from `bvid=`). */
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

export function pickHintIds(hints: BilibiliPageHints = {}): Partial<BilibiliContext> {
  const out: Partial<BilibiliContext> = {};
  if (hints.mid) out.mid = hints.mid;
  if (hints.season_id) out.season_id = hints.season_id;
  if (hints.media_id) out.media_id = hints.media_id;
  if (hints.bvid) out.bvid = hints.bvid;
  if (hints.keyword) out.keyword = hints.keyword;
  return out;
}

/**
 * URL-only page hints (DOM-free half of legacy extractPageHints).
 * Callers may merge DOM season / meta hints before detectContext.
 */
export function extractUrlHints(href: string): BilibiliPageHints {
  const hints: BilibiliPageHints = {
    bvid: "",
    mid: "",
    season_id: "",
    media_id: "",
    keyword: "",
    fromVideoPath: false,
  };
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return hints;
  }
  hints.bvid =
    extractBvid(url.href) || extractBvid(url.searchParams.get("bvid") || "") || "";
  hints.keyword = (url.searchParams.get("keyword") || "").trim();
  const sid =
    url.searchParams.get("sid") ||
    url.searchParams.get("season_id") ||
    url.searchParams.get("business_id") ||
    "";
  if (sid && /^\d+$/.test(String(sid))) hints.season_id = String(sid);
  const fid = url.searchParams.get("fid") || "";
  if (fid && /^\d+$/.test(fid)) hints.media_id = fid;
  if (/\/video\//i.test(url.pathname)) hints.fromVideoPath = true;

  let match = url.href.match(/space\.bilibili\.com\/(\d+)/i);
  if (match?.[1]) hints.mid = match[1];
  match = url.pathname.match(/^\/list\/(\d+)/i);
  if (match?.[1]) hints.mid = match[1];
  match = url.pathname.match(/^\/(\d+)(?:\/|$)/);
  if (match?.[1] && /space\.bilibili\.com/i.test(url.hostname)) {
    hints.mid = match[1];
  }
  return hints;
}

/**
 * DOM-free route detector matching v6.0.2 detectContext semantics.
 * Pass page-derived hints (season / mid / media / bvid) via `hints`.
 */
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
  const merged: BilibiliPageHints = {
    ...extractUrlHints(href),
    ...Object.fromEntries(
      Object.entries(hints).filter(([, value]) => value != null && value !== ""),
    ),
  };

  // search
  if (host === "search.bilibili.com") {
    if (/^\/(all|video)\/?$/i.test(path)) {
      const keyword =
        (url.searchParams.get("keyword") || "").trim() || merged.keyword;
      if (keyword) {
        const allowed = new Set([
          "totalrank",
          "click",
          "pubdate",
          "dm",
          "stow",
          "scores",
        ]);
        const order = (url.searchParams.get("order") || "totalrank")
          .trim()
          .toLowerCase();
        return {
          type: "search",
          source: "auto",
          keyword,
          order: allowed.has(order) ? order : "totalrank",
          page: Math.max(
            1,
            Number.parseInt(url.searchParams.get("page") || "1", 10) || 1,
          ),
        };
      }
    }
    return { type: "unknown", source: "auto" };
  }

  // space
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
    match = path.match(/^\/(\d+)\/channel\/collectiondetail\/?$/i);
    if (match?.[1]) {
      const seasonId =
        url.searchParams.get("sid") ||
        url.searchParams.get("season_id") ||
        merged.season_id;
      if (seasonId && /^\d+$/.test(String(seasonId))) {
        return {
          type: "collection",
          source: "auto",
          mid: match[1],
          season_id: String(seasonId),
        };
      }
    }
    match = path.match(/^\/(\d+)\/channel\/seriesdetail\/?$/i);
    if (match?.[1]) {
      const seasonId =
        url.searchParams.get("sid") ||
        url.searchParams.get("season_id") ||
        merged.season_id;
      if (seasonId && /^\d+$/.test(String(seasonId))) {
        return {
          type: "collection",
          source: "auto",
          mid: match[1],
          season_id: String(seasonId),
        };
      }
    }
    const mediaId = (url.searchParams.get("fid") || merged.media_id || "").trim();
    if (mediaId && /^\d+$/.test(mediaId) && /\/favlist\/?$/i.test(path)) {
      return { type: "favorite", source: "auto", media_id: mediaId };
    }
    match = path.match(/^\/(\d+)/);
    if (match?.[1]) {
      const segments = path.split("/").filter(Boolean);
      const mid = match[1];
      if (
        segments.length === 1 ||
        (segments.length === 2 &&
          /^(video|upload|dynamic|favlist)?$/i.test(segments[1] || "")) ||
        (segments.length === 3 &&
          segments[1] === "upload" &&
          segments[2] === "video")
      ) {
        if (segments[1] && /^favlist$/i.test(segments[1]) && !mediaId) {
          return { type: "user", source: "auto", mid, note: "favlist_no_fid" };
        }
        return { type: "user", source: "auto", mid };
      }
      return {
        type: "user",
        source: "auto",
        mid,
        note: "space_tab",
        ...(merged.bvid ? { bvid: merged.bvid } : {}),
      };
    }
    return { type: "unknown", source: "auto", ...pickHintIds(merged) };
  }

  // www.bilibili.com
  if (/^(www\.)?bilibili\.com$/i.test(host)) {
    let match = path.match(/^\/medialist\/(?:detail|play)\/ml(\d+)\/?$/i);
    if (match?.[1]) {
      return { type: "favorite", source: "auto", media_id: match[1] };
    }

    match = path.match(/^\/list\/ml(\d+)\/?/i);
    if (match?.[1]) {
      return { type: "favorite", source: "auto", media_id: match[1] };
    }

    match = path.match(/^\/list\/(\d+)\/?/i);
    if (match?.[1]) {
      const mid = match[1];
      const seasonId =
        url.searchParams.get("sid") ||
        url.searchParams.get("season_id") ||
        merged.season_id;
      const bvid =
        extractBvid(href) ||
        extractBvid(url.searchParams.get("bvid") || "") ||
        merged.bvid ||
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

    match = path.match(/^\/(?:fav|list)\/(?:ml)?(\d+)\/?$/i);
    if (match?.[1] && !path.startsWith("/list/")) {
      return { type: "favorite", source: "auto", media_id: match[1] };
    }
    if (/^\/favlist\/?$/i.test(path)) {
      const fid = (url.searchParams.get("fid") || merged.media_id || "").trim();
      if (fid && /^\d+$/.test(fid)) {
        return { type: "favorite", source: "auto", media_id: fid };
      }
    }

    const bvid =
      extractBvid(path) || extractBvid(href) || merged.bvid || "";
    if (bvid && (/\/video\//i.test(path) || merged.fromVideoPath)) {
      const page = Math.max(
        1,
        Number.parseInt(url.searchParams.get("p") || "1", 10) || 1,
      );
      const ctx: BilibiliContext = {
        type: "video",
        source: "auto",
        bvid,
        page,
      };
      if (merged.mid && merged.season_id) {
        ctx.mid = merged.mid;
        ctx.season_id = merged.season_id;
        ctx.note = "video_has_ugc_season";
      }
      return ctx;
    }

    if (/\/list\//i.test(path)) {
      const bvid2 =
        extractBvid(href) ||
        extractBvid(url.searchParams.get("bvid") || "") ||
        merged.bvid ||
        "";
      if (bvid2) {
        return {
          type: "video",
          source: "auto",
          bvid: bvid2,
          page: Math.max(
            1,
            Number.parseInt(url.searchParams.get("p") || "1", 10) || 1,
          ),
          ...(merged.mid ? { mid: merged.mid } : {}),
          ...(merged.season_id ? { season_id: merged.season_id } : {}),
          note: "list_fallback_video",
        };
      }
    }
  }

  if (merged.bvid) {
    return {
      type: "video",
      source: "auto",
      bvid: merged.bvid,
      page: 1,
      ...(merged.mid ? { mid: merged.mid } : {}),
      ...(merged.season_id ? { season_id: merged.season_id } : {}),
      note: "dom_bvid",
    };
  }
  return { type: "unknown", source: "auto", ...pickHintIds(merged) };
}
