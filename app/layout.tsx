import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import { CalendarProvider } from "@/components/CalendarContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IHMS — Integrated Hotel Management System",
  description:
    "A comprehensive hotel management platform for guests, staff, and administrators — BSc CSIT 7th Semester Project",
  manifest: "/manifest.json",
  themeColor: "#1B2A4A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B2A4A" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <CalendarProvider>
            {children}
          </CalendarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
