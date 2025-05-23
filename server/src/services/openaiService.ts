import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.openai.apiKey,
});

export async function generateChatResponse(
  systemPrompt: string,
  userQuery: string
) {
  return await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
  });
}

export async function generateChatStream(
  systemPrompt: string,
  userQuery: string
) {
  return await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    stream: true,
  });
}

export { client };
