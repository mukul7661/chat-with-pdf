import { Request, Response } from "express";
import { MulterRequest, FileStatus } from "../models/index.js";
import {
  addToQueue,
  trackFileStatus,
  completeFileStatus,
  getFileStatusByJobIds,
  getFileStatusByChatId,
  areAllFilesCompleted,
} from "../services/queueService.js";

export async function uploadSingleFile(req: MulterRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const job = await addToQueue({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    });

    return res.json({ message: "uploaded", jobId: job.id });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "Error uploading file" });
  }
}

export async function uploadMultipleFiles(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    const chatId = req.body.chatId as string;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (!chatId) {
      return res.status(400).json({ error: "No chat ID provided" });
    }

    const jobIds: string[] = [];

    // Process each file by adding it to the queue
    for (const file of files) {
      const job = await addToQueue({
        filename: file.originalname,
        destination: file.destination,
        path: file.path,
        chatId: chatId,
      });

      // Track the file's processing status
      await trackFileStatus(job, file.originalname, chatId);
      jobIds.push(job.id as string);
    }

    return res.json({
      message: "Files uploaded successfully",
      count: files.length,
      jobIds: jobIds,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({ error: "Error uploading files" });
  }
}

export async function getFileStatus(req: Request, res: Response) {
  const jobIds = req.query.jobIds
    ? (req.query.jobIds as string).split(",")
    : [];
  const chatId = req.query.chatId as string | undefined;

  if (!jobIds.length && !chatId) {
    return res
      .status(400)
      .json({ error: "Either jobIds or chatId must be provided" });
  }

  try {
    let statuses: (FileStatus | { jobId: string; status: string })[] = [];

    if (jobIds.length) {
      // Get status for specific job IDs
      statuses = getFileStatusByJobIds(jobIds);
    } else if (chatId) {
      // Get all statuses for a chat ID
      statuses = getFileStatusByChatId(chatId);
    }

    const allCompleted = areAllFilesCompleted(statuses);

    return res.json({
      statuses,
      allCompleted,
    });
  } catch (error) {
    console.error("Error checking file status:", error);
    return res.status(500).json({ error: "Error checking file status" });
  }
}

export async function completeJob(req: Request, res: Response) {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: "No job ID provided" });
  }

  try {
    const fileStatus = await completeFileStatus(jobId);

    if (fileStatus) {
      return res.json({
        message: "Job marked as completed",
        status: fileStatus,
      });
    } else {
      return res.status(404).json({ error: "Job not found" });
    }
  } catch (error) {
    console.error("Error completing job:", error);
    return res.status(500).json({ error: "Error completing job" });
  }
}
