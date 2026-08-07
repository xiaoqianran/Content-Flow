export type ContentType =
  | "video_transcript"
  | "article"
  | "web_page"
  | "pdf"
  | "selection";

export interface Content {
  id: string;
  type: ContentType;
  source: string;
  sourceId: string;
  title: string;
  author?: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

