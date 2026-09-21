import type { Metadata } from "next";
import "./globals.css";

import TopNav from "@/components/TopNave";
import SideNave from "@/components/SideNave";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "نظام الإدارة المحاسبية",
  description: "نظام إدارة ومحاسبة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <Toaster position="top-center" richColors closeButton duration={4000} />

        <div className="flex min-h-screen w-full">
          <div className="hidden lg:block lg:w-64 lg:shrink-0">
            <SideNave />
          </div>

          <div className="block lg:hidden">
            <TopNav />
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
