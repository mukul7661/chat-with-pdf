import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import path from "path";

export async function processPdfFile(
  filePath: string,
  originalFilename: string,
  chatId: string
): Promise<Document[]> {
  // Load the PDF
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  // Enhance each document with the source filename in metadata
  const enhancedDocs = docs.map((doc) => {
    // Keep existing metadata and add/update source property
    const metadata = {
      ...doc.metadata,
      source: doc.metadata?.source || filePath,
      originalFilename: originalFilename,
      chatId: chatId,
    };

    return new Document({
      pageContent: doc.pageContent,
      metadata: metadata,
    });
  });

  // Split the documents into chunks
  const textSplitter = new CharacterTextSplitter({
    separator: "\n",
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  return await textSplitter.splitDocuments(enhancedDocs);
}

export function getOriginalFilename(filename: string): string {
  return path.basename(filename);
}
