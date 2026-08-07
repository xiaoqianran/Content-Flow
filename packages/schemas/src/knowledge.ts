import type { RunStatus } from "./artifact";

export interface KnowledgeAnchor {
  id: string;
  contentId: string;
  transcriptVersionId?: string;
  selectedText: string;
  segmentIds: string[];
  timeStart?: number;
  timeEnd?: number;
  contextText: string;
  sourceHash: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeThreadNode {
  id: string;
  anchorId: string;
  parentId?: string;
  question: string;
  answer: string;
  suggestions: string[];
  modelId?: string;
  starred: boolean;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
}

