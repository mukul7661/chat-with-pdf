import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";
dotenv.config();
// Function to notify the server that a job is completed
async function notifyJobCompletion(jobId) {
    try {
        const response = await fetch("http://localhost:8000/complete-job", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobId }),
        });
        if (!response.ok) {
            console.error(`Failed to notify job completion: ${response.statusText}`);
        }
        else {
            console.log(`Successfully notified job completion for job ${jobId}`);
        }
    }
    catch (error) {
        console.error("Error notifying job completion:", error);
    }
}
const worker = new Worker("file-upload-queue", async (job) => {
    console.log(`Processing job:`, job.data);
    const data = JSON.parse(job.data);
    try {
        // Load the PDF
        const loader = new PDFLoader(data.path);
        const docs = await loader.load();
        // Get the original filename (without the path)
        const originalFilename = path.basename(data.filename);
        const chatId = data.chatId || "unknown";
        // Enhance each document with the source filename in metadata
        const enhancedDocs = docs.map((doc) => {
            // Keep existing metadata and add/update source property
            const metadata = {
                ...doc.metadata,
                source: doc.metadata?.source || data.path,
                originalFilename: originalFilename,
                chatId: chatId,
            };
            return new Document({
                pageContent: doc.pageContent,
                metadata: metadata,
            });
        });
        console.log(`Loaded ${enhancedDocs.length} documents from ${originalFilename} for chat ${chatId}`);
        // Split the documents into chunks
        const textSplitter = new CharacterTextSplitter({
            separator: "\n",
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(enhancedDocs);
        console.log(`Split into ${splitDocs.length} chunks for processing`);
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-small",
            apiKey: process.env.OPENAI_API_KEY || "",
        });
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: "http://localhost:6333",
            collectionName: "langchainjs-testing",
        });
        await vectorStore.addDocuments(splitDocs);
        console.log(`All chunks from ${originalFilename} are added to vector store`);
        // Notify job completion
        await notifyJobCompletion(job.id);
    }
    catch (error) {
        console.error(`Error processing file ${data.filename}:`, error);
        // Notify that the job failed but is completed
        await notifyJobCompletion(job.id);
    }
}, {
    concurrency: 100,
    connection: {
        host: "localhost",
        port: 6379,
    },
});
