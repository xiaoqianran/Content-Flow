export type RunStatus = "running" | "completed" | "stopped" | "error";

export interface Artifact {
  id: string;
  contentId: string;
  type: "mermaid" | "note" | "quiz" | "custom";
  promptId: string;
  modelId: string;
  content: string;
  status: RunStatus;
  createdAt: string;
}

