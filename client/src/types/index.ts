export interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
    originalFilename?: string;
    chatId?: string;
  };
  id?: string;
}

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  documents?: Doc[];
}

export interface FileStatus {
  name: string;
  status: "uploading" | "processing" | "success" | "error";
  jobId?: string;
}

export interface ChatComponentProps {
  chatId: string;
}

export interface FileUploadProps {
  chatId: string;
}
