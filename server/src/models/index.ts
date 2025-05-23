export interface FileUploadJob {
  filename: string;
  destination: string;
  path: string;
  chatId?: string;
}

export interface FileStatus {
  jobId: string;
  filename: string;
  chatId: string;
  status: "processing" | "completed" | "unknown";
  createdAt: Date;
  completedAt?: Date;
}

export interface MulterRequest extends Express.Request {
  file?: Express.Multer.File;
}
