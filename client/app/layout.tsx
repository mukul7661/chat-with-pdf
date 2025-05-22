import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignedOut,
  SignUp,
  SignedIn,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ThemeToggle } from "@/app/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Insights - AI-powered Document Analysis",
  description: "Chat with your PDFs using advanced AI technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
              <ThemeToggle />
              <SignedOut>
                <div className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md overflow-hidden">
                  <SignUpButton />
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
            <SignedIn>{children}</SignedIn>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
