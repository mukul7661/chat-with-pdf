"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { Send, File, ExternalLink } from "lucide-react";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
  id?: string;
}

interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(message)}`
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.message,
          documents: data?.docs,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const formatMessageContent = (content?: string) => {
    if (!content) return "";

    // Split by line breaks and render paragraphs
    return content.split("\n").map((line, i) => (
      <p
        key={i}
        className={line.match(/^\*\*.*\*\*$/) ? "font-bold my-1" : "my-1"}
      >
        {line}
      </p>
    ));
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
                </div>
                <div className="prose prose-sm">
                  {formatMessageContent(msg.content)}
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
                            {doc.metadata?.source?.split("/").pop() ||
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
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!message.trim()}
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
