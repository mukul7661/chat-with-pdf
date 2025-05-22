import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`Processing job:`, job.data);
    const data = JSON.parse(job.data);

    try {
      // Load the PDF
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      // Get the original filename (without the path)
      const originalFilename = path.basename(data.filename);

      // Enhance each document with the source filename in metadata
      const enhancedDocs = docs.map((doc) => {
        // Keep existing metadata and add/update source property
        const metadata = {
          ...doc.metadata,
          source: doc.metadata?.source || data.path,
          originalFilename: originalFilename,
          chatId: data.chatId,
        };

        return new Document({
          pageContent: doc.pageContent,
          metadata: metadata,
        });
      });

      console.log(
        `Loaded ${enhancedDocs.length} documents from ${originalFilename} for chat ${data.chatId}`
      );

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

      await vectorStore.addDocuments(enhancedDocs);
      console.log(
        `All documents from ${originalFilename} are added to vector store`
      );
    } catch (error) {
      console.error(`Error processing file ${data.filename}:`, error);
    }
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: "6379",
    },
  }
);
