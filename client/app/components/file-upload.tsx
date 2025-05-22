"use client";
import * as React from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FileUploadComponent: React.FC = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<
    "idle" | "success" | "error"
  >("idle");
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setFileName(file.name);
      setUploadStatus("idle");

      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("http://localhost:8000/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploadStatus("success");
      console.log("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUploadButtonClick = () => {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", "application/pdf");
    el.addEventListener("change", async (ev) => {
      if (el.files && el.files.length > 0) {
        const file = el.files.item(0);
        if (file) {
          await handleFileUpload(file);
        }
      }
    });
    el.click();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        await handleFileUpload(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">PDF Chat</h2>
        <p className="text-slate-600 mb-6">
          Upload a PDF document to start chatting with its contents
        </p>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 mb-4 transition-all
            flex flex-col items-center justify-center
            ${
              isUploading
                ? "bg-slate-100 border-slate-300"
                : "hover:bg-slate-50 border-slate-300"
            }
            ${uploadStatus === "success" ? "bg-green-50 border-green-300" : ""}
            ${uploadStatus === "error" ? "bg-red-50 border-red-300" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleFileUploadButtonClick}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-4">
              <div className="animate-pulse mb-2">
                <FileText size={48} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">
                Uploading {fileName}...
              </p>
            </div>
          ) : uploadStatus === "success" ? (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 text-green-500">
                <Check size={48} />
              </div>
              <p className="text-slate-700 font-medium">{fileName}</p>
              <p className="text-green-600 text-sm mt-1">
                Successfully uploaded
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileUploadButtonClick();
                }}
                className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-800"
                variant="outline"
              >
                Upload another PDF
              </Button>
            </div>
          ) : uploadStatus === "error" ? (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 text-red-500">
                <AlertCircle size={48} />
              </div>
              <p className="text-slate-700 font-medium">{fileName}</p>
              <p className="text-red-600 text-sm mt-1">
                Upload failed. Please try again.
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileUploadButtonClick();
                }}
                className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-800"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="bg-slate-100 rounded-full p-4 mb-4">
                <Upload size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-700 font-medium mb-1">
                Drop your PDF here
              </p>
              <p className="text-slate-500 text-sm mb-3">or click to browse</p>
              <p className="text-xs text-slate-400">Supported format: PDF</p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-slate-500">
          <p>Your documents remain private and secure</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;
