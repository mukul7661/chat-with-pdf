"use client";
import * as React from "react";
import { Upload, FileText, Check, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileStatus {
  name: string;
  status: "uploading" | "success" | "error";
}

interface FileUploadProps {
  chatId: string;
}

const FileUploadComponent: React.FC<FileUploadProps> = ({ chatId }) => {
  const [fileStatuses, setFileStatuses] = React.useState<FileStatus[]>([]);

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
  };

  const removeFile = (fileName: string) => {
    setFileStatuses((current) => current.filter((f) => f.name !== fileName));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">PDF Chat</h2>
        <p className="text-slate-600 mb-6">
          Upload PDF documents to start chatting with their contents
        </p>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 mb-4 transition-all
            flex flex-col items-center justify-center
            hover:bg-slate-50 border-slate-300
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleFileUploadButtonClick}
        >
          <div className="flex flex-col items-center py-6">
            <div className="bg-slate-100 rounded-full p-4 mb-4">
              <Upload size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-700 font-medium mb-1">
              Drop your PDFs here
            </p>
            <p className="text-slate-500 text-sm mb-3">or click to browse</p>
            <p className="text-xs text-slate-400">Supported format: PDF</p>
          </div>
        </div>

        {fileStatuses.length > 0 && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <h3 className="font-medium text-slate-700 p-3 bg-slate-50 border-b">
              Uploaded Documents ({fileStatuses.length})
            </h3>
            <ul className="divide-y">
              {fileStatuses.map((file, index) => (
                <li
                  key={index}
                  className="p-3 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FileText size={16} className="text-slate-500 mr-2" />
                    <span className="text-sm text-slate-700 mr-2">
                      {file.name}
                    </span>
                    {file.status === "uploading" && (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full animate-pulse">
                        Uploading...
                      </span>
                    )}
                    {file.status === "success" && (
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        <Check size={12} className="inline mr-1" />
                        Success
                      </span>
                    )}
                    {file.status === "error" && (
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">
                        <AlertCircle size={12} className="inline mr-1" />
                        Failed
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-red-500 p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center text-sm text-slate-500 mt-4">
          <p>Your documents remain private and secure</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;
