import Image from "next/image";
import { SignUpButton } from "@clerk/nextjs";

export function LandingHero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl w-full space-y-12 text-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
            Chat with your PDFs using
            <span className="text-indigo-600 dark:text-indigo-400"> AI</span>
          </h1>

          <p className="text-xl sm:text-2xl max-w-3xl mx-auto text-slate-600 dark:text-slate-300">
            Upload your documents and get instant insights, summaries, and
            answers powered by advanced AI technology.
          </p>

          <div className="pt-4 w-full flex justify-center">
            <div className="w-fit rounded-full bg-indigo-600 px-8 py-4 text-white text-lg font-medium shadow-lg hover:bg-indigo-700 transition-colors">
              <SignUpButton mode="modal">Get Started For Free</SignUpButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              Lightning Fast
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Get instant insights from your documents with our optimized AI
              processing.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              Secure & Private
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Your documents are encrypted and processed with the highest
              security standards.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              Always Available
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Access your documents and insights anytime, anywhere, from any
              device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
