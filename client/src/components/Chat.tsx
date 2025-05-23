"use client";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import * as React from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  AlertCircle,
  ExternalLink,
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
} from "../../components/ui/dialog";
import { useChat } from "../hooks";
import { ChatComponentProps, IMessage, Doc } from "../types";
import { createKeyTermsMatcher } from "../utils";

const ChatComponent: React.FC<ChatComponentProps> = ({ chatId }) => {
  const {
    message,
    setMessage,
    messages,
    isStreaming,
    messagesEndRef,
    inputRef,
    handleSendMessage,
    handleKeyDown,
  } = useChat(chatId);

  // Function to highlight relevant text
  const highlightRelevantText = (
    text: string,
    userQuery: string,
    assistantResponse: string
  ) => {
    const keyTerms = createKeyTermsMatcher(userQuery);

    // If no key terms or the text is too short, just return the text
    if (keyTerms.length === 0 || text.length < 100) {
      return text;
    }

    // Create regex to match key terms
    const keyTermsRegex = new RegExp(`(${keyTerms.join("|")})`, "gi");

    // Replace matches with highlighted version
    return text.replace(
      keyTermsRegex,
      '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>'
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat header */}
      <div className="p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">PDF Chat</h2>
          </div>
        </div>
      </div>

      {/* Message container */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-6 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mx-auto flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Your chat session is ready
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Upload a PDF document and start asking questions about its
                content.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg: IMessage, idx: number) => (
            <div key={idx} className="flex gap-3">
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-indigo-100 dark:bg-indigo-900/30"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`prose dark:prose-invert max-w-none ${
                    msg.isLoading ? "animate-pulse" : ""
                  }`}
                >
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline inline-flex items-center"
                        >
                          {props.children}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ),
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="relative group">
                            <pre
                              className={`${className} rounded p-4 overflow-x-auto`}
                            >
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.role === "assistant" && msg.content === ""
                      ? "_Thinking..._"
                      : msg.content}
                  </ReactMarkdown>
                </div>

                {/* Source documents dialog */}
                {msg.role === "assistant" &&
                  msg.documents &&
                  msg.documents.length > 0 && (
                    <div className="mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex gap-1 items-center h-auto py-1 text-gray-500 dark:text-gray-400"
                          >
                            <span>View Sources</span>
                            <span className="bg-gray-100 dark:bg-gray-800 rounded-full h-5 w-5 flex items-center justify-center text-xs">
                              {msg.documents.length}
                            </span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Source Documents</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 my-4">
                            {msg.documents.map((doc: Doc, idx: number) => {
                              // Get user message before this assistant message
                              const userMsgIdx = messages.findIndex(
                                (m, i) =>
                                  m.role === "user" &&
                                  i < idx &&
                                  messages[i + 1] === msg
                              );
                              const userMsg =
                                userMsgIdx >= 0 ? messages[userMsgIdx] : null;
                              const userQuery = userMsg ? userMsg.content : "";

                              return (
                                <div
                                  key={idx}
                                  className="border dark:border-gray-700 rounded-lg p-4"
                                >
                                  <div className="flex justify-between gap-2 mb-2">
                                    <div className="text-sm font-medium">
                                      {doc.metadata?.originalFilename ||
                                        "Document"}
                                      {doc.metadata?.loc?.pageNumber && (
                                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                                          Page {doc.metadata.loc.pageNumber}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm border dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800/50 max-h-64 overflow-y-auto">
                                    {doc.pageContent && (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: highlightRelevantText(
                                            doc.pageContent,
                                            userQuery,
                                            msg.content
                                          ),
                                        }}
                                      ></div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
        <div className="flex rounded-lg border dark:border-gray-700 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors overflow-hidden">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your uploaded documents..."
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isStreaming}
            className="rounded-l-none"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
