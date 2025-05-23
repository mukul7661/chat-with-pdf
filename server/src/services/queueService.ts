import { Queue, Job } from "bullmq";
import { env } from "../config/env.js";
import { FileStatus, FileUploadJob } from "../models/index.js";

// Track processing status of files
const processingFiles = new Map<string, FileStatus>();

const fileQueue = new Queue("file-upload-queue", {
  connection: {
    host: env.redis.host,
    port: env.redis.port,
  },
});

export async function addToQueue(jobData: FileUploadJob): Promise<Job> {
  return await fileQueue.add("file-ready", JSON.stringify(jobData));
}

export async function trackFileStatus(
  job: Job,
  filename: string,
  chatId: string
): Promise<void> {
  processingFiles.set(job.id as string, {
    jobId: job.id as string,
    filename,
    chatId,
    status: "processing",
    createdAt: new Date(),
  });
}

export async function completeFileStatus(
  jobId: string
): Promise<FileStatus | null> {
  const fileStatus = processingFiles.get(jobId);

  if (fileStatus) {
    fileStatus.status = "completed";
    fileStatus.completedAt = new Date();
    processingFiles.set(jobId, fileStatus);
    return fileStatus;
  }

  return null;
}

export function getFileStatusByJobIds(
  jobIds: string[]
): (FileStatus | { jobId: string; status: string })[] {
  return jobIds.map((id) => {
    const status = processingFiles.get(id);
    return status || { jobId: id, status: "unknown" };
  });
}

export function getFileStatusByChatId(chatId: string): FileStatus[] {
  const statuses: FileStatus[] = [];

  for (const [, status] of processingFiles.entries()) {
    if (status.chatId === chatId) {
      statuses.push(status);
    }
  }

  return statuses;
}

export function areAllFilesCompleted(
  statuses: (FileStatus | { jobId: string; status: string })[]
): boolean {
  return (
    statuses.length > 0 &&
    statuses.every((status) => status.status === "completed")
  );
}

export { fileQueue };
