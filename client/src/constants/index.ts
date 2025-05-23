// API endpoints
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  UPLOAD_PDFS: `${API_BASE_URL}/upload/pdfs`,
  CHAT: `${API_BASE_URL}/chat`,
  CHAT_STREAM: `${API_BASE_URL}/chat/stream`,
  FILE_STATUS: `${API_BASE_URL}/file-status`,
};

// File upload settings
export const FILE_UPLOAD_SETTINGS = {
  MAX_FILES: 10,
  ACCEPTED_FILE_TYPES: "application/pdf",
  POLLING_INTERVAL: 2000, // 2 seconds
};

// Chat settings
export const CHAT_SETTINGS = {
  DEFAULT_SYSTEM_PROMPT:
    "You are a helpful assistant that answers questions based on the content of the uploaded PDFs.",
};

// UI settings
export const UI_SETTINGS = {
  ANIMATION_DURATION: 0.3,
};

export const ERROR_MESSAGES = {
  NO_FILE_UPLOADED:
    "No data has been provided. Please upload a PDF document first.",
  FILES_PROCESSING:
    "Your documents are still being processed. Please wait until processing is complete before asking questions.",
  UPLOAD_FAILED: "Failed to upload files. Please try again.",
  CHAT_ERROR: "Failed to process chat request. Please try again.",
};
