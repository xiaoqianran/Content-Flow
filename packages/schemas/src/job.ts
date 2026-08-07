import type { RunStatus } from "./artifact";

export interface Job {
  id: string;
  contentId: string;
  workflowId?: string;
  status: RunStatus;
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

