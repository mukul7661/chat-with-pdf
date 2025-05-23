import { Worker, Job } from "bullmq";
import { FileUploadJob } from "../models/index.js";
import {
  processPdfFile,
  getOriginalFilename,
} from "../services/fileService.js";
import { addDocumentsToVectorStore } from "../services/vectorStoreService.js";
import { env } from "../config/env.js";
import fetch from "node-fetch";

// Function to notify the server that a job is completed
async function notifyJobCompletion(jobId: string): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${env.port}/complete-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      console.error(`Failed to notify job completion: ${response.statusText}`);
    } else {
      console.log(`Successfully notified job completion for job ${jobId}`);
    }
  } catch (error) {
    console.error("Error notifying job completion:", error);
  }
}

export function startWorker() {
  const worker = new Worker(
    "file-upload-queue",
    async (job: Job) => {
      console.log(`Processing job:`, job.data);
      const data: FileUploadJob = JSON.parse(job.data);

      try {
        // Get the original filename (without the path)
        const originalFilename = getOriginalFilename(data.filename);
        const chatId = data.chatId || "unknown";

        console.log(`Processing file ${originalFilename} for chat ${chatId}`);

        // Process the PDF file
        const splitDocs = await processPdfFile(
          data.path,
          originalFilename,
          chatId
        );

        console.log(`Split into ${splitDocs.length} chunks for processing`);

        // Add documents to vector store
        await addDocumentsToVectorStore(splitDocs);

        console.log(
          `All chunks from ${originalFilename} are added to vector store`
        );

        // Notify job completion
        await notifyJobCompletion(job.id as string);
      } catch (error) {
        console.error(`Error processing file ${data.filename}:`, error);
        // Notify that the job failed but is completed
        await notifyJobCompletion(job.id as string);
      }
    },
    {
      concurrency: 100,
      connection: {
        host: env.redis.host,
        port: env.redis.port,
      },
    }
  );

  console.log("Worker started and listening for jobs");

  return worker;
}
