import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { env } from "../config/env.js";

export async function getVectorStore() {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: env.openai.apiKey,
  });

  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: env.qdrant.url,
    collectionName: env.qdrant.collection,
  });
}

export async function addDocumentsToVectorStore(documents: Document[]) {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(documents);
}

export async function searchVectorStore(
  query: string,
  chatId: string,
  k: number = 4
) {
  const vectorStore = await getVectorStore();

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

  const retriever = vectorStore.asRetriever({
    k,
    filter,
  });

  return await retriever.invoke(query);
}
