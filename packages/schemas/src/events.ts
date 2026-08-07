export type SubBatchEvent =
  | { type: "content.created"; contentId: string }
  | { type: "transcript.created"; contentId: string; transcriptVersionId: string }
  | { type: "job.updated"; jobId: string; status: string; progress: number }
  | { type: "artifact.created"; artifactId: string; contentId: string };

