"use client";
import * as React from "react";
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useFileUpload } from "../hooks";
import { FileUploadProps, FileStatus } from "../types";
import { FILE_UPLOAD_SETTINGS } from "../constants";

const FileUploadComponent: React.FC<FileUploadProps> = ({ chatId }) => {
  const {
    fileStatuses,
    isDragging,
    setIsDragging,
    handleFileUpload,
    removeFile,
  } = useFileUpload(chatId);

  const handleFileUploadButtonClick = () => {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", FILE_UPLOAD_SETTINGS.ACCEPTED_FILE_TYPES);
    el.setAttribute("multiple", "true");
    el.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFileUpload(target.files);
      }
    });
    el.click();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-500" />
          Files
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload PDFs to chat with their contents
        </p>
      </div>

      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileUploadButtonClick}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload
            className={`h-12 w-12 mb-2 ${
              isDragging
                ? "text-indigo-500"
                : "text-gray-400 dark:text-gray-500"
            }`}
          />
          <p
            className={`font-medium ${
              isDragging
                ? "text-indigo-500"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Drop files here or click to browse
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PDF files only
          </p>
        </div>
      </div>

      {/* File list */}
      <div className="flex-grow overflow-auto">
        <AnimatePresence initial={false}>
          {fileStatuses.map((file: FileStatus, index: number) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <div className="flex items-center gap-3 p-3 border rounded-md dark:border-gray-800 dark:bg-gray-800/50 bg-white">
                <div className="flex-shrink-0">
                  <FileText
                    className={`h-5 w-5 ${
                      file.status === "error"
                        ? "text-red-500"
                        : file.status === "success"
                        ? "text-green-500"
                        : "text-indigo-500"
                    }`}
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "Processing..."}
                    {file.status === "success" && (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        Ready for chat
                      </>
                    )}
                    {file.status === "error" && (
                      <>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Failed to process
                      </>
                    )}
                  </p>
                </div>
                {(file.status === "success" || file.status === "error") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                    onClick={() => removeFile(file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FileUploadComponent;
