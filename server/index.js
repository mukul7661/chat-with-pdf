import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

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

app.get("/", (req, res) => {
  return res.json({ status: "All Good!" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: "uploaded" });
});

// New endpoint for multiple files
app.post("/upload/pdfs", upload.array("pdfs", 10), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Process each file by adding it to the queue
    for (const file of files) {
      await queue.add(
        "file-ready",
        JSON.stringify({
          filename: file.originalname,
          destination: file.destination,
          path: file.path,
        })
      );
    }

    return res.json({
      message: "Files uploaded successfully",
      count: files.length,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({ error: "Error uploading files" });
  }
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "langchainjs-testing",
    }
  );
  const ret = vectorStore.asRetriever({
    k: 4,
  });
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
});

app.get("/chat/stream", async (req, res) => {
  const userQuery = req.query.message;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "langchainjs-testing",
      }
    );

    const ret = vectorStore.asRetriever({
      k: 4,
    });

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
  } catch (error) {
    console.error("Streaming error:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
    );
  } finally {
    res.end();
  }
});

app.listen(8000, () => console.log(`Server started on PORT:${8000}`));
