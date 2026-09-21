import type { Metadata } from "next";
import "./globals.css";

import TopNav from "@/components/TopNave";
import SideNave from "@/components/SideNave";

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
        <div className="flex min-h-screen w-full">
          {/* =================================================
              القائمة الجانبية - الشاشات الكبيرة
          ================================================= */}

          <div className="hidden lg:block lg:w-64 lg:shrink-0">
            <SideNave />
          </div>

          {/* =================================================
              القائمة العلوية - الشاشات الصغيرة
          ================================================= */}

          <div className="block lg:hidden">
            <TopNav />
          </div>

          {/* =================================================
              المحتوى
          ================================================= */}

          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
