import { describe, expect, it } from "vitest";

import {
  detectContext,
  extractBvid,
  extractUrlHints,
  pickHintIds,
  routeVideoKey,
  type BilibiliPageHints,
} from "@subbatch/bilibili";

import { legacyFunction } from "./legacy-harness";

type UnknownFunction = (...args: any[]) => any;

const legacyExtractBvid = legacyFunction<UnknownFunction>("extractBvid");
const legacyRouteVideoKey = legacyFunction<UnknownFunction>("routeVideoKey");
const legacyPickHintIds = legacyFunction<UnknownFunction>("pickHintIds");

function legacyDetect(href: string, hints: BilibiliPageHints = {}) {
  const detectContextLegacy = legacyFunction<UnknownFunction>("detectContext", {
    extractBvid: legacyExtractBvid,
    extractPageHints: () => hints,
    pickHintIds: legacyPickHintIds,
  });
  return detectContextLegacy(href);
}

const ROUTE_CASES: Array<{
  name: string;
  href: string;
  hints?: BilibiliPageHints;
}> = [
  {
    name: "single video with P part",
    href: "https://www.bilibili.com/video/BV1Ab411c7mD?p=3",
  },
  {
    name: "list collection with sid + bvid + p",
    href: "https://www.bilibili.com/list/123456?sid=98765&bvid=BV1Q541167Qg&p=2",
  },
  {
    name: "list without sid falls back to video",
    href: "https://www.bilibili.com/list/123456?bvid=BV1Q541167Qg&p=1",
  },
  {
    name: "list mid only",
    href: "https://www.bilibili.com/list/123456",
  },
  {
    name: "favorite medialist detail",
    href: "https://www.bilibili.com/medialist/detail/ml998877",
  },
  {
    name: "favorite medialist play",
    href: "https://www.bilibili.com/medialist/play/ml112233",
  },
  {
    name: "favorite list/ml",
    href: "https://www.bilibili.com/list/ml445566",
  },
  {
    name: "www favlist with fid",
    href: "https://www.bilibili.com/favlist?fid=778899",
  },
  {
    name: "space lists collection",
    href: "https://space.bilibili.com/12345/lists/67890",
  },
  {
    name: "space collectiondetail with sid",
    href: "https://space.bilibili.com/12345/channel/collectiondetail?sid=555",
  },
  {
    name: "space seriesdetail with season_id",
    href: "https://space.bilibili.com/999/channel/seriesdetail?season_id=321",
  },
  {
    name: "space favlist with fid",
    href: "https://space.bilibili.com/12345/favlist?fid=42",
  },
  {
    name: "space favlist without fid",
    href: "https://space.bilibili.com/12345/favlist",
  },
  {
    name: "space user root",
    href: "https://space.bilibili.com/12345",
  },
  {
    name: "space user video tab",
    href: "https://space.bilibili.com/12345/video",
  },
  {
    name: "space other tab",
    href: "https://space.bilibili.com/12345/fans/follow",
  },
  {
    name: "search all with keyword",
    href: "https://search.bilibili.com/all?keyword=typescript&order=pubdate&page=2",
  },
  {
    name: "search video invalid order falls back",
    href: "https://search.bilibili.com/video?keyword=rust&order=not-real",
  },
  {
    name: "video with DOM season hints",
    href: "https://www.bilibili.com/video/BV1xx411c7mD?p=4",
    hints: { mid: "100", season_id: "200" },
  },
  {
    name: "DOM bvid fallback",
    href: "https://www.bilibili.com/",
    hints: { bvid: "BV1domFallback01", mid: "1", season_id: "2" },
  },
  {
    name: "list fallback video path",
    href: "https://www.bilibili.com/list/watchlater?bvid=BV1watchLater01&p=2",
    hints: { mid: "9", season_id: "8" },
  },
];

describe("Bilibili route differential (legacy vs new)", () => {
  it("extractBvid / routeVideoKey match legacy", () => {
    const samples = [
      "https://www.bilibili.com/video/bv1Ab411c7mD",
      "BV1Ab411c7mD",
      "not-a-video",
      "https://www.bilibili.com/list/1?bvid=BV1Q541167Qg",
      "",
      null,
    ];
    for (const sample of samples) {
      expect(extractBvid(sample as string)).toBe(legacyExtractBvid(sample));
    }
    expect(routeVideoKey("bv1Test", 0)).toBe(legacyRouteVideoKey("bv1Test", 0));
    expect(routeVideoKey("BV1x", 5)).toBe(legacyRouteVideoKey("BV1x", 5));
  });

  it("pickHintIds matches legacy", () => {
    const hints = {
      mid: "1",
      season_id: "2",
      media_id: "3",
      bvid: "BV1x",
      keyword: "k",
    };
    expect(pickHintIds(hints)).toEqual(legacyPickHintIds(hints));
  });

  it.each(ROUTE_CASES)("$name", ({ href, hints }) => {
    const pageHints = hints ?? {};
    // New core merges extractUrlHints; legacy receives the same effective hints
    // via extractPageHints mock (URL-only + explicit DOM overrides).
    const effectiveHints = { ...extractUrlHints(href), ...pageHints };
    const next = detectContext(href, pageHints);
    const legacy = legacyDetect(href, effectiveHints);
    expect(next).toEqual(legacy);
  });
});
