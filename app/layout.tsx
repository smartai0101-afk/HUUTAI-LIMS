import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { getSessionUser } from "@/lib/auth/session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lab Inventory LIMS",
  description: "Modern laboratory inventory management dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionUser();

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-full bg-slate-50">
        <SessionProvider initialSession={session}>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
