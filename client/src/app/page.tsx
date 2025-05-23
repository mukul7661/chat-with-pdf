"use client";
import FileUploadComponent from "../components/FileUpload";
import ChatComponent from "../components/Chat";
import { useState, useEffect } from "react";
import { generateUUID } from "../utils";

export default function Home() {
  const [chatId, setChatId] = useState<string>("");

  useEffect(() => {
    // Generate a unique chat ID when the page loads
    setChatId(generateUUID());
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-[400px] bg-white dark:bg-slate-800 shadow-lg z-10 overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
          <div className="h-full p-6">
            {chatId && <FileUploadComponent chatId={chatId} />}
          </div>
        </div>
        <div className="flex-1">
          <ChatComponent chatId={chatId} />
        </div>
      </div>
    </main>
  );
}
