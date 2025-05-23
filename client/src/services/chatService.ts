import { API_ENDPOINTS } from "../constants";
import { IMessage, Doc } from "../types";

export async function sendChatMessage(message: string, chatId: string) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.CHAT}?message=${encodeURIComponent(
        message
      )}&chatId=${encodeURIComponent(chatId)}`
    );

    if (!response.ok) {
      throw new Error("Failed to send chat message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}

export function connectChatStream(
  message: string,
  chatId: string,
  onDocsReceived: (docs: Doc[]) => void,
  onTokenReceived: (token: string, accumulated: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  let accumulatedContent = "";

  try {
    const eventSource = new EventSource(
      `${API_ENDPOINTS.CHAT_STREAM}?message=${encodeURIComponent(
        message
      )}&chatId=${encodeURIComponent(chatId)}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "docs") {
        onDocsReceived(data.docs);
      } else if (data.type === "token") {
        accumulatedContent += data.content;
        onTokenReceived(data.content, accumulatedContent);
      } else if (data.type === "done") {
        eventSource.close();
        onComplete();
      } else if (data.type === "error") {
        eventSource.close();
        onError(new Error(data.error));
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      onError(
        error instanceof Error
          ? error
          : new Error("Unknown error in EventSource")
      );
    };

    // Return a function to close the connection
    return () => {
      eventSource.close();
    };
  } catch (error) {
    onError(
      error instanceof Error
        ? error
        : new Error("Failed to connect to chat stream")
    );
    return () => {}; // Return empty function for consistent API
  }
}
