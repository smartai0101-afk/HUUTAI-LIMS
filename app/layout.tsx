import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { isPublicAuthPath } from "@/lib/auth/public-paths";
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
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (!session && pathname && !isPublicAuthPath(pathname)) {
    redirect("/login?reason=session");
  }

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
