import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNave";

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
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 border-l bg-white">
            <TopNav />
          </aside>

          <main className="min-w-0 flex-1 w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
