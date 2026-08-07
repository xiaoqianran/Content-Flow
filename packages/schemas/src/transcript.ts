export interface TranscriptSegment {
  id: string;
  start: number;
  end?: number;
  text: string;
  sourceCueIds?: string[];
}

export interface TranscriptVersion {
  id: string;
  contentId: string;
  kind: "raw" | "normalized";
  text: string;
  segments: TranscriptSegment[];
  sourceHash: string;
  createdAt: string;
}

