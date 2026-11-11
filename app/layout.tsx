import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Wazan ERP",
  description: "نظام وزان لإدارة الشركات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <Toaster position="top-left" richColors closeButton duration={4000} />

        {children}
      </body>
    </html>
  );
}
