import { useState, useEffect, useRef, useCallback } from "react";
import { FileStatus } from "../types";
import { uploadFiles, checkFileStatus } from "../services/fileService";
import { useFileStore } from "../store";
import { FILE_UPLOAD_SETTINGS } from "../constants";

export function useFileUpload(chatId: string) {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { updateFileStatus } = useFileStore();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for file processing status
  const checkFilesStatus = useCallback(
    async (jobIds: string[]) => {
      if (jobIds.length === 0 || isChecking) return;

      setIsChecking(true);
      try {
        const data = await checkFileStatus(jobIds);

        // Update file statuses based on backend response
        setFileStatuses((current) => {
          const updatedStatuses = current.map((fileStatus) => {
            const updatedStatus = data.statuses.find(
              (s: any) => s.jobId === fileStatus.jobId
            );

            if (updatedStatus && updatedStatus.status === "completed") {
              return {
                ...fileStatus,
                status: "success" as const,
              };
            }

            return fileStatus;
          });

          return updatedStatuses;
        });

        // If all files are processed, stop polling
        if (data.allCompleted) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error checking file status:", error);
      } finally {
        setIsChecking(false);
      }
    },
    [isChecking]
  );

  // Effect to update shared file upload state
  useEffect(() => {
    // Check if any files are successfully processed
    const hasSuccessFiles = fileStatuses.some(
      (file) => file.status === "success"
    );

    // Update global state based on file statuses
    updateFileStatus(hasSuccessFiles);
  }, [fileStatuses, updateFileStatus]);

  // Start polling when component mounts or when file statuses change
  useEffect(() => {
    const processingFiles = fileStatuses.filter(
      (f) => f.status === "processing" && f.jobId
    );

    if (processingFiles.length > 0) {
      const jobIds = processingFiles
        .map((f) => f.jobId as string)
        .filter(Boolean);

      // Clear existing interval if any
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Check immediately
      checkFilesStatus(jobIds);

      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        checkFilesStatus(jobIds);
      }, FILE_UPLOAD_SETTINGS.POLLING_INTERVAL);
    }

    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fileStatuses, checkFilesStatus]);

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      status: "uploading" as const,
    }));

    setFileStatuses((prev) => [...prev, ...newFiles]);

    try {
      const data = await uploadFiles(Array.from(files), chatId);

      // Mark files as processing (not success yet) and associate job IDs
      setFileStatuses((current) =>
        current.map((f, index) => {
          if (Array.from(files).some((file) => file.name === f.name)) {
            const fileIndex = Array.from(files).findIndex(
              (file) => file.name === f.name
            );
            return {
              ...f,
              status: "processing" as const,
              jobId: data.jobIds[fileIndex],
            };
          }
          return f;
        })
      );

      // Notify that the upload itself succeeded (not processing)
      updateFileStatus(true);

      return data;
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

      throw error;
    }
  };

  const removeFile = (fileName: string) => {
    setFileStatuses((current) => current.filter((f) => f.name !== fileName));
  };

  return {
    fileStatuses,
    isDragging,
    setIsDragging,
    handleFileUpload,
    removeFile,
  };
}
