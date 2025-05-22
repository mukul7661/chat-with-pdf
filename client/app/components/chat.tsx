"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";
import {
  Send,
  File,
  ExternalLink,
  Bot,
  User,
  Loader2,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
    originalFilename?: string;
    chatId?: string;
  };
  id?: string;
}

interface IMessage {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  documents?: Doc[];
}

// Utility function to generate a random UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ChatComponentProps {
  chatId: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ chatId }) => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
        )}&chatId=${encodeURIComponent(chatId)}`
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
                isLoading: false,
              };
            }
            return newMessages;
          });
          setIsStreaming(false);
          eventSource.close();
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
                "Sorry, I encountered an error. Please try again.",
              isLoading: false,
            };
          }
          return newMessages;
        });
        setIsStreaming(false);
        eventSource.close();
      };
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendChatMessageStreaming();
    }
  };

  // Function to identify and highlight key fragments of text
  const highlightRelevantText = (
    text: string,
    userQuery: string,
    assistantResponse: string
  ) => {
    if (!text) return [];

    // Create a set of important terms from the user query and assistant response
    const createKeyTerms = (text: string) => {
      const normalized = text
        .toLowerCase()
        .replace(/[.,?!;:()"'-]/g, " ") // Replace punctuation with spaces
        .replace(/\s+/g, " ")
        .trim(); // Normalize spaces

      // Extract terms with 4+ characters as potentially meaningful
      return normalized
        .split(" ")
        .filter((word) => word.length >= 4)
        .reduce((acc, word) => {
          acc.add(word);
          return acc;
        }, new Set<string>());
    };

    const queryTerms = createKeyTerms(userQuery);
    const responseTerms = createKeyTerms(assistantResponse);

    // Split text into paragraphs
    const paragraphs = text.split("\n");

    // Score each paragraph based on query and response term matches
    const scoredParagraphs = paragraphs.map((paragraph, index) => {
      const normalizedParagraph = paragraph.toLowerCase();
      let score = 0;

      // Score based on query terms (higher weight)
      queryTerms.forEach((term) => {
        if (normalizedParagraph.includes(term)) score += 2;
      });

      // Score based on response terms (lower weight)
      responseTerms.forEach((term) => {
        if (normalizedParagraph.includes(term)) score += 1;
      });

      return {
        text: paragraph,
        score,
        index,
      };
    });

    // Sort by score (highest first) and mark top scoring paragraphs as highlighted
    return scoredParagraphs.map((para) => ({
      ...para,
      isHighlighted: para.score > 0,
    }));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-indigo-50/50 to-slate-50/80 dark:from-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-md">
        <div className="max-w-screen-xl mx-auto flex items-center">
          <Bot size={24} className="mr-3" />
          <div>
            <h1 className="text-xl font-bold">PDF Assistant</h1>
            <p className="text-xs text-indigo-100 opacity-90">Powered by AI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative h-[calc(100vh-4rem)]">
        {messages.length === 0 ? (
          // Centered input when no messages
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-lg mx-auto px-6">
              <div className="relative">
                <motion.div
                  className="absolute -top-32 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white mb-6">
                    <MessageSquare size={28} />
                  </div>
                  <h2 className="text-xl font-medium text-center text-slate-800 dark:text-slate-200 mb-1 whitespace-nowrap">
                    Ask anything about your PDFs
                  </h2>
                </motion.div>
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question here..."
                  className="h-14 text-lg rounded-full pl-4 pr-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-md focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                  disabled={isStreaming}
                />
                <Button
                  onClick={handleSendChatMessageStreaming}
                  disabled={!message.trim() || isStreaming}
                  className="absolute right-1 top-1.5 rounded-full w-11 h-11 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Messages layout when conversation exists
          <>
            <div
              className="flex-1 overflow-auto px-4 py-6 md:px-6 lg:px-8 pb-24 md:pb-20"
              ref={chatContainerRef}
            >
              <div className="max-w-screen-lg mx-auto">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index === messages.length - 1 ? 0 : 0,
                      }}
                      className={`mb-6 w-full flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex items-start gap-3 max-w-[80%]">
                        <div
                          className={`flex-shrink-0 ${
                            msg.role === "assistant"
                              ? "order-first"
                              : "order-last"
                          }`}
                        >
                          <div
                            className={`
                            rounded-full w-8 h-8 flex items-center justify-center
                            ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
                            }
                          `}
                          >
                            {msg.role === "user" ? (
                              <User size={14} />
                            ) : (
                              <Bot
                                size={14}
                                className="text-indigo-600 dark:text-indigo-400"
                              />
                            )}
                          </div>
                        </div>

                        <div
                          className={`
                          rounded-2xl p-4 shadow-sm
                          ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          }
                        `}
                        >
                          {msg.isLoading && (
                            <div className="flex items-center mb-2 text-xs text-indigo-100 dark:text-slate-400">
                              <Loader2
                                size={12}
                                className="animate-spin mr-1"
                              />
                              <span>Generating response...</span>
                            </div>
                          )}
                          <div
                            className={`prose prose-sm max-w-none ${
                              msg.role === "user"
                                ? "prose-invert"
                                : "prose-slate dark:prose-invert"
                            }`}
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
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return !inline && match ? (
                                      <div className="bg-slate-800 dark:bg-slate-900 rounded-md p-4 my-2 overflow-x-auto">
                                        <pre className="text-slate-100">
                                          <code
                                            className={className}
                                            {...props}
                                          >
                                            {children}
                                          </code>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code
                                        className={`${className} bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200`}
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
                            <div className="mt-3 pt-3 border-t border-indigo-200/40 dark:border-slate-700/60">
                              <div className="text-xs font-medium text-indigo-100 dark:text-slate-400 mb-2">
                                Sources:
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {msg.documents.map((doc, i) => {
                                  // Find the user's message that preceded this assistant message
                                  const userMessage = messages.find(
                                    (m, idx) =>
                                      m.role === "user" &&
                                      messages[idx + 1]?.role === "assistant" &&
                                      messages[idx + 1] === msg
                                  );

                                  const userQuery = userMessage?.content || "";
                                  const assistantResponse = msg.content;

                                  return (
                                    <Dialog key={i}>
                                      <DialogTrigger asChild>
                                        <div className="bg-white/90 dark:bg-slate-700/50 rounded-lg p-2 text-xs cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200/50 dark:border-slate-600/50">
                                          <div className="flex items-center text-slate-700 dark:text-slate-300 mb-1">
                                            <File
                                              size={12}
                                              className="mr-2 text-indigo-600 dark:text-indigo-400"
                                            />
                                            <span className="truncate font-medium">
                                              {doc.metadata?.originalFilename ||
                                                doc.metadata?.source
                                                  ?.split("/")
                                                  .pop() ||
                                                "Document"}
                                              {doc.metadata?.loc?.pageNumber &&
                                                ` (Page ${doc.metadata.loc.pageNumber})`}
                                            </span>
                                          </div>
                                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {doc.pageContent}
                                          </p>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <File
                                              size={16}
                                              className="text-indigo-600"
                                            />
                                            <span>
                                              {doc.metadata?.originalFilename ||
                                                doc.metadata?.source
                                                  ?.split("/")
                                                  .pop() ||
                                                "Document"}
                                              {doc.metadata?.loc?.pageNumber &&
                                                ` (Page ${doc.metadata.loc.pageNumber})`}
                                            </span>
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 px-3 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                          <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                                            {highlightRelevantText(
                                              doc.pageContent || "",
                                              userQuery,
                                              assistantResponse
                                            ).map((paragraph, idx) =>
                                              paragraph.text.trim() ? (
                                                <p
                                                  key={idx}
                                                  className={`mb-3 ${
                                                    paragraph.isHighlighted
                                                      ? "bg-yellow-100/80 dark:bg-yellow-900/20 px-2 py-1 border-l-4 border-yellow-500 dark:border-yellow-600 rounded"
                                                      : ""
                                                  }`}
                                                >
                                                  {paragraph.text}
                                                </p>
                                              ) : (
                                                <div
                                                  key={idx}
                                                  className="h-3"
                                                ></div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 right-0 py-4 px-4 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-screen-lg mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your documents..."
                    className="rounded-full pl-4 pr-12 py-6 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-sm focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                    disabled={isStreaming}
                  />
                  <Button
                    onClick={handleSendChatMessageStreaming}
                    disabled={!message.trim() || isStreaming}
                    className="absolute right-1 top-1 rounded-full w-10 h-10 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
