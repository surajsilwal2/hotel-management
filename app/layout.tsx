import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "IHMS — Integrated Hotel Management System",
  description:
    "A comprehensive hotel management platform for guests, staff, and administrators — BSc CSIT 7th Semester Project",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.variable}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
