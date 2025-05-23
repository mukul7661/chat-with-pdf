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
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useFileStore } from "@/lib/store";

interface FileStatus {
  name: string;
  status: "uploading" | "success" | "error";
}

interface FileUploadProps {
  chatId: string;
}

const FileUploadComponent: React.FC<FileUploadProps> = ({ chatId }) => {
  const [fileStatuses, setFileStatuses] = React.useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const { setFileUploaded } = useFileStore();

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      status: "uploading" as const,
    }));

    setFileStatuses((prev) => [...prev, ...newFiles]);

    try {
      const formData = new FormData();

      // Append all files to the formData with the key 'pdfs'
      Array.from(files).forEach((file) => {
        formData.append("pdfs", file);
      });

      // Include the chat ID in the upload
      formData.append("chatId", chatId);

      const response = await fetch("http://localhost:8000/upload/pdfs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      // Mark all files as successfully uploaded
      setFileStatuses((current) =>
        current.map((f) =>
          Array.from(files).some((file) => file.name === f.name)
            ? { ...f, status: "success" as const }
            : f
        )
      );

      // Set the file uploaded state to true
      setFileUploaded(true);

      console.log(`${files.length} files uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading files:`, error);

      // Mark all files as failed
      setFileStatuses((current) =>
        current.map((f) =>
          Array.from(files).some((file) => file.name === f.name)
            ? { ...f, status: "error" as const }
            : f
        )
      );
    }
  };

  const handleFileUploadButtonClick = () => {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.setAttribute("multiple", "true");
    el.addEventListener("change", async (ev) => {
      if (el.files && el.files.length > 0) {
        await handleFileUpload(el.files);
      }
    });
    el.click();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "application/pdf"
      );

      if (pdfFiles.length > 0) {
        await handleFileUpload(e.dataTransfer.files);
      }
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

  const removeFile = (fileName: string) => {
    setFileStatuses((current) => {
      const updatedFiles = current.filter((f) => f.name !== fileName);

      // If there are no files left with success status, update the isFileUploaded state
      if (!updatedFiles.some((file) => file.status === "success")) {
        setFileUploaded(false);
      }

      return updatedFiles;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            PDF Insights
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Upload documents to chat with their content
          </p>
        </div>
      </div>

      <motion.div
        className={`
          border-2 border-dashed rounded-xl transition-all cursor-pointer
          hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20
          ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30"
              : "border-slate-200 dark:border-slate-700"
          }
          flex flex-col items-center justify-center mb-5
        `}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={handleFileUploadButtonClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center py-8 px-4">
          <motion.div
            className={`rounded-full p-5 mb-5 ${
              isDragging
                ? "bg-indigo-100 dark:bg-indigo-900/40"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload
              size={32}
              className={`${
                isDragging
                  ? "text-indigo-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            />
          </motion.div>
          <p className="font-medium mb-1 text-center">
            {isDragging ? "Release to upload" : "Drag & drop PDFs here"}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-3">
            or click to browse files
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 dark:border-slate-700"
          >
            Select PDF files
          </Button>
        </div>
      </motion.div>

      {fileStatuses.length > 0 && (
        <div className="flex-1 overflow-auto">
          <div className="border dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50 shadow-sm">
            <div className="border-b dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center">
              <h3 className="font-medium text-slate-700 dark:text-slate-300">
                Documents
              </h3>
              <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {fileStatuses.length}
              </div>
            </div>

            <AnimatePresence>
              <ul className="divide-y dark:divide-slate-700">
                {fileStatuses.map((file, index) => (
                  <motion.li
                    key={index}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center min-w-0">
                      <div
                        className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
                        ${
                          file.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : file.status === "error"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-slate-100 dark:bg-slate-800"
                        }
                      `}
                      >
                        {file.status === "uploading" ? (
                          <div className="w-4 h-4 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        ) : file.status === "success" ? (
                          <Check
                            size={16}
                            className="text-green-600 dark:text-green-400"
                          />
                        ) : (
                          <AlertCircle
                            size={16}
                            className="text-red-600 dark:text-red-400"
                          />
                        )}
                      </div>
                      <div className="truncate pr-2">
                        <div className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {file.status === "uploading"
                            ? "Uploading..."
                            : file.status === "success"
                            ? "Successfully uploaded"
                            : "Upload failed"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1 h-auto rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.name);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 pt-4 border-t dark:border-slate-700">
        <p>Your documents remain private and secure</p>
      </div>
    </div>
  );
};

export default FileUploadComponent;
