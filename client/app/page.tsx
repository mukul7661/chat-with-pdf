"use client";
import FileUploadComponent from "./components/file-upload";
import ChatComponent from "./components/chat";
import { useState, useEffect } from "react";

// Utility function to generate a random UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function Home() {
  const [chatId, setChatId] = useState<string>("");

  useEffect(() => {
    // Generate a unique chat ID when the page loads
    setChatId(generateUUID());
  }, []);

  return (
    <main className="bg-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-[350px] bg-white p-6 flex items-center justify-center shadow-sm z-10">
          {chatId && <FileUploadComponent chatId={chatId} />}
        </div>
        <div className="flex-1 md:border-l border-slate-200">
          <ChatComponent chatId={chatId} />
        </div>
      </div>
    </main>
  );
}
