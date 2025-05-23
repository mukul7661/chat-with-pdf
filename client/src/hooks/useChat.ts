import { useState, useRef, useEffect, useCallback } from "react";
import { IMessage, Doc } from "../types";
import { connectChatStream } from "../services/chatService";
import { useFileStore } from "../store";
import { ERROR_MESSAGES } from "../constants";
import { checkFileStatusByChatId } from "../services/fileService";

export function useChat(chatId: string) {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isFileUploaded, fileStatusLastUpdated } = useFileStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const lastUpdateCheckRef = useRef<number>(0);
  const closeStreamRef = useRef<() => void>(() => {});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check if files are still processing
  useEffect(() => {
    const checkProcessingStatus = async () => {
      try {
        const data = await checkFileStatusByChatId(chatId);

        const hasProcessingFiles = data.statuses.some(
          (s: any) => s.status === "processing"
        );

        setIsProcessing(hasProcessingFiles);
        lastUpdateCheckRef.current = Date.now();
      } catch (error) {
        console.error("Error checking processing status:", error);
      }
    };

    // Check immediately when fileStatusLastUpdated changes
    if (fileStatusLastUpdated > lastUpdateCheckRef.current) {
      checkProcessingStatus();
    }

    // Keep polling at a reduced frequency as a backup
    const interval = setInterval(checkProcessingStatus, 1000);

    return () => clearInterval(interval);
  }, [chatId, fileStatusLastUpdated]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isStreaming) return;

    // Check if any files are still processing
    if (isProcessing) {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: ERROR_MESSAGES.FILES_PROCESSING,
        },
      ]);
      setMessage("");
      return;
    }

    // Check if any files have been uploaded
    if (!isFileUploaded) {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: ERROR_MESSAGES.NO_FILE_UPLOADED,
        },
      ]);
      setMessage("");
      return;
    }

    const userMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isLoading: true },
    ]);
    setMessage("");
    setIsStreaming(true);

    try {
      // Close any existing stream
      closeStreamRef.current();

      // Create a new streaming connection
      closeStreamRef.current = connectChatStream(
        userMessage,
        chatId,
        (docs: Doc[]) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                documents: docs,
              };
            }
            return newMessages;
          });
        },
        (token: string, accumulatedContent: string) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: accumulatedContent,
                isLoading: true,
              };
            }
            return newMessages;
          });
        },
        () => {
          setIsStreaming(false);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                isLoading: false,
              };
            }
            return newMessages;
          });

          // Focus on input after completion
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        },
        (error: Error) => {
          console.error("Chat stream error:", error);
          setIsStreaming(false);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: `${lastMessage.content || ""}\n\nError: ${
                  error.message
                }`,
                isLoading: false,
              };
            }
            return newMessages;
          });
        }
      );
    } catch (error) {
      console.error("Error setting up chat stream:", error);
      setIsStreaming(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant") {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content: ERROR_MESSAGES.CHAT_ERROR,
            isLoading: false,
          };
        }
        return newMessages;
      });
    }
  }, [message, isStreaming, isProcessing, isFileUploaded, chatId]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return {
    message,
    setMessage,
    messages,
    isStreaming,
    messagesEndRef,
    inputRef,
    isProcessing,
    handleSendMessage,
    handleKeyDown,
  };
}
