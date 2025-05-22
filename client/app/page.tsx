import FileUploadComponent from "./components/file-upload";
import ChatComponent from "./components/chat";

export default function Home() {
  return (
    <main className="bg-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-[350px] bg-white p-6 flex items-center justify-center shadow-sm z-10">
          <FileUploadComponent />
        </div>
        <div className="flex-1 md:border-l border-slate-200">
          <ChatComponent />
        </div>
      </div>
    </main>
  );
}
