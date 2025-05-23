import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { Queue, Job } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

interface FileUploadJob {
  filename: string;
  destination: string;
  path: string;
  chatId?: string;
}

interface FileStatus {
  jobId: string;
  filename: string;
  chatId: string;
  status: "processing" | "completed" | "unknown";
  createdAt: Date;
  completedAt?: Date;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

// Track processing status of files
const processingFiles = new Map<string, FileStatus>();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  return res.json({ status: "All Good!" });
});

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

app.post(
  "/upload/pdf",
  upload.single("pdf"),
  async (req: MulterRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await queue.add(
      "file-ready",
      JSON.stringify({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      })
    );
    return res.json({ message: "uploaded" });
  }
);

// New endpoint for multiple files
app.post(
  "/upload/pdfs",
  upload.array("pdfs", 10),
  async (req: Request, res: Response) => {
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
        const job: Job = await queue.add(
          "file-ready",
          JSON.stringify({
            filename: file.originalname,
            destination: file.destination,
            path: file.path,
            chatId: chatId,
          })
        );

        // Track the file's processing status
        processingFiles.set(job.id as string, {
          jobId: job.id as string,
          filename: file.originalname,
          chatId: chatId,
          status: "processing",
          createdAt: new Date(),
        });

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
);

// New endpoint to check processing status
app.get("/file-status", async (req: Request, res: Response) => {
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
      statuses = jobIds.map((id) => {
        const status = processingFiles.get(id);
        return status || { jobId: id, status: "unknown" };
      });
    } else if (chatId) {
      // Get all statuses for a chat ID
      for (const [id, status] of processingFiles.entries()) {
        if (status.chatId === chatId) {
          statuses.push(status);
        }
      }
    }

    const allCompleted =
      statuses.length > 0 &&
      statuses.every((status) => status.status === "completed");

    return res.json({
      statuses,
      allCompleted,
    });
  } catch (error) {
    console.error("Error checking file status:", error);
    return res.status(500).json({ error: "Error checking file status" });
  }
});

// New endpoint to mark a job as completed - to be called by the worker
app.post(
  "/complete-job",
  express.json(),
  async (req: Request, res: Response) => {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "No job ID provided" });
    }

    try {
      const fileStatus = processingFiles.get(jobId);

      if (fileStatus) {
        fileStatus.status = "completed";
        fileStatus.completedAt = new Date();
        processingFiles.set(jobId, fileStatus);

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
);

app.get("/chat", async (req: Request, res: Response) => {
  const userQuery = req.query.message as string | undefined;
  const chatId = req.query.chatId as string | undefined;

  if (!chatId) {
    return res.status(400).json({ error: "No chat ID provided" });
  }

  if (!userQuery) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "langchainjs-testing",
      }
    );

    // Create a filter to only get documents with the current chatId
    const filter = {
      must: [
        {
          key: "metadata.chatId",
          match: {
            value: chatId,
          },
        },
      ],
    };

    const ret = vectorStore.asRetriever({
      k: 4,
      filter: filter,
    });

    // Non-null assertion to inform TypeScript that userQuery is a string
    const result = await ret.invoke(userQuery);

    const SYSTEM_PROMPT = `
    You are helfull AI Assistant who answeres the user query based on the available context from PDF Files.
    Context:
    ${JSON.stringify(result)}
    `;

    const chatResult = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery },
      ],
    });

    return res.json({
      message: chatResult.choices[0].message.content,
      docs: result,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
});

app.get("/chat/stream", async (req: Request, res: Response) => {
  const userQuery = req.query.message as string | undefined;
  const chatId = req.query.chatId as string | undefined;

  if (!chatId) {
    return res.status(400).json({ error: "No chat ID provided" });
  }

  if (!userQuery) {
    return res.status(400).json({ error: "No message provided" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "langchainjs-testing",
      }
    );

    // Create a filter to only get documents with the current chatId
    const filter = {
      must: [
        {
          key: "metadata.chatId",
          match: {
            value: chatId,
          },
        },
      ],
    };

    const ret = vectorStore.asRetriever({
      k: 4,
      filter: filter,
    });

    // Non-null assertion to inform TypeScript that userQuery is a string
    const result = await ret.invoke(userQuery);

    // Send documents first
    res.write(`data: ${JSON.stringify({ type: "docs", docs: result })}\n\n`);

    const SYSTEM_PROMPT = `
    You are helfull AI Assistant who answeres the user query based on the available context from PDF Files.
    When referring to sources, mention which document(s) the information came from if that metadata is available.
    Context:
    ${JSON.stringify(result)}
    `;

    const stream = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ type: "token", content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (error: any) {
    console.error("Streaming error:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
    );
  } finally {
    res.end();
  }
});

app.listen(8000, () => console.log(`Server started on PORT:${8000}`));
