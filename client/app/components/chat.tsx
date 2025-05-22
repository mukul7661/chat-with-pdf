"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { Send, File, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
    originalFilename?: string;
  };
  id?: string;
}

interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
  isLoading?: boolean;
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessageStreaming = async () => {
    if (!message.trim() || isStreaming) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isLoading: true },
    ]);
    setMessage("");
    setIsStreaming(true);

    try {
      const eventSource = new EventSource(
        `http://localhost:8000/chat/stream?message=${encodeURIComponent(
          message
        )}`
      );

      let accumulatedContent = "";
      let documents: Doc[] | undefined;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "docs") {
          documents = data.docs;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                documents,
              };
            }
            return newMessages;
          });
        } else if (data.type === "token") {
          accumulatedContent += data.content;
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
        } else if (data.type === "done") {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: accumulatedContent,
                documents,
                isLoading: false,
              };
            }
            return newMessages;
          });
          eventSource.close();
          setIsStreaming(false);
        } else if (data.type === "error") {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: "Sorry, there was an error processing your request.",
                isLoading: false,
              };
            }
            return newMessages;
          });
          eventSource.close();
          setIsStreaming(false);
        }
      };

      eventSource.onerror = () => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant") {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content:
                accumulatedContent ||
                "Sorry, there was an error connecting to the server.",
              isLoading: false,
            };
          }
          return newMessages;
        });
        eventSource.close();
        setIsStreaming(false);
      };
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant") {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            content: "Sorry, there was an error processing your request.",
            isLoading: false,
          };
        }
        return newMessages;
      });
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessageStreaming();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-slate-800 p-4 text-white">
        <h1 className="text-xl font-bold">PDF Chat Assistant</h1>
        <p className="text-sm opacity-75">
          Ask questions about your uploaded documents
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-slate-100">
              <File size={24} />
            </div>
            <p className="text-center text-lg font-medium">
              Upload a PDF and start asking questions
            </p>
            <p className="text-center text-sm mt-2">
              Your conversation will appear here
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 max-w-3xl ${
                msg.role === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                <div className="font-medium mb-1">
                  {msg.role === "user" ? "You" : "Assistant"}
                  {msg.isLoading && (
                    <span className="ml-2 text-xs opacity-75 animate-pulse">
                      typing...
                    </span>
                  )}
                </div>
                <div
                  className={`prose prose-sm ${
                    msg.role === "user" ? "prose-invert" : "prose-slate"
                  } max-w-none`}
                >
                  {msg.content ? (
                    <ReactMarkdown
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="bg-slate-800 rounded-md p-4 my-2 overflow-x-auto">
                              <pre className="text-slate-100">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code
                              className={`${className} bg-slate-200 px-1 py-0.5 rounded text-slate-800`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    ""
                  )}
                </div>

                {msg.documents && msg.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs font-medium text-slate-500 mb-2">
                      Sources:
                    </div>
                    {msg.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="bg-slate-100 rounded p-2 mb-2 text-xs"
                      >
                        <div className="flex items-center text-slate-600 mb-1">
                          <File size={12} className="mr-1" />
                          <span className="truncate">
                            {doc.metadata?.originalFilename ||
                              doc.metadata?.source?.split("/").pop() ||
                              "Document"}
                            {doc.metadata?.loc?.pageNumber &&
                              ` (Page ${doc.metadata.loc.pageNumber})`}
                          </span>
                        </div>
                        <p className="text-slate-700 line-clamp-2">
                          {doc.pageContent}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSendChatMessageStreaming}
            disabled={!message.trim() || isStreaming}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
