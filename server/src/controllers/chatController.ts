import { Request, Response } from "express";
import { searchVectorStore } from "../services/vectorStoreService.js";
import {
  generateChatResponse,
  generateChatStream,
} from "../services/openaiService.js";

export async function handleChatQuery(req: Request, res: Response) {
  const userQuery = req.query.message as string | undefined;
  const chatId = req.query.chatId as string | undefined;

  if (!chatId) {
    return res.status(400).json({ error: "No chat ID provided" });
  }

  if (!userQuery) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Retrieve relevant documents from vector store
    const result = await searchVectorStore(userQuery, chatId);

    const SYSTEM_PROMPT = `
    You are helfull AI Assistant who answeres the user query based on the available context from PDF Files.
    Context:
    ${JSON.stringify(result)}
    `;

    const chatResult = await generateChatResponse(SYSTEM_PROMPT, userQuery);

    return res.json({
      message: chatResult.choices[0].message.content,
      docs: result,
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
}

export async function handleChatStream(req: Request, res: Response) {
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
    // Retrieve relevant documents from vector store
    const result = await searchVectorStore(userQuery, chatId);

    // Send documents first
    res.write(`data: ${JSON.stringify({ type: "docs", docs: result })}\n\n`);

    const SYSTEM_PROMPT = `
    You are helfull AI Assistant who answeres the user query based on the available context from PDF Files.
    When referring to sources, mention which document(s) the information came from if that metadata is available.
    Context:
    ${JSON.stringify(result)}
    `;

    const stream = await generateChatStream(SYSTEM_PROMPT, userQuery);

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
}
